import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail = require('@sendgrid/mail');
import { getFirestore } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import { COLLECTIONS } from '../shared/constants';
import type { BlockEntry, MessageDocument, UserProfile } from './types';
import type { UserCredits } from '../credits/types';

sgMail.setApiKey(config.SENDGRID_KEY);

const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME  = process.env['SENDGRID_FROM_NAME']  ?? 'Your App';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[rejectMessage] ${msg}`, data ?? {});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 500;

// ─── Email ────────────────────────────────────────────────────────────────────

async function notifyJobSeeker(toEmail: string, name: string, reason: string): Promise<void> {
  await sgMail.send({
    to: toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: 'Your message request was declined',
    text:
      `Hi ${name},\n\n` +
      'Unfortunately, your message request has been declined by the recruiter.\n\n' +
      `Reason: ${reason}\n\n` +
      'You can explore other opportunities on the platform.\n\n' +
      'The Team',
  });
}

// ─── Callable Function ────────────────────────────────────────────────────────

export const rejectMessage = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { messageId: string; reason: string }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { messageId, reason } = data ?? {};
    if (!messageId?.trim()) {
      throw new functions.https.HttpsError('invalid-argument', 'messageId is required.');
    }
    if (!reason?.trim() || reason.trim().length < MIN_REASON_LENGTH) {
      throw new functions.https.HttpsError('invalid-argument', `reason must be at least ${MIN_REASON_LENGTH} characters.`);
    }
    if (reason.trim().length > MAX_REASON_LENGTH) {
      throw new functions.https.HttpsError('invalid-argument', `reason exceeds ${MAX_REASON_LENGTH} characters.`);
    }

    const uid = context.auth.uid;
    const db = getFirestore();
    const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;
    const messageRef = db.collection('messages').doc(messageId);
    const trimmedReason = reason.trim();

    log('Reject request', { messageId, uid });

    let jobSeeker: UserProfile;

    await db.runTransaction(async (tx) => {
      const messageSnap = await tx.get(messageRef);
      if (!messageSnap.exists) {
        throw new functions.https.HttpsError('not-found', `Message ${messageId} not found.`);
      }

      const message = messageSnap.data() as MessageDocument;

      if (message.toUserId !== uid) {
        throw new functions.https.HttpsError('permission-denied', 'Only the intended recipient can reject this message.');
      }
      if (message.status === 'rejected') {
        throw new functions.https.HttpsError('already-exists', 'Message has already been rejected.');
      }
      if (message.status === 'expired') {
        throw new functions.https.HttpsError('failed-precondition', 'Cannot reject an expired message.');
      }

      const seekerRef = db.collection(COLLECTIONS.USERS).doc(message.fromUserId);
      const seekerSnap = await tx.get(seekerRef);
      if (!seekerSnap.exists) throw new functions.https.HttpsError('not-found', 'Job seeker profile not found.');

      jobSeeker = seekerSnap.data() as UserProfile;

      // Deduct credit inline — same pattern as acceptMessage.ts
      if (message.creditDeducted !== true) {
        const { balance = 0 } = (seekerSnap.data() ?? {}) as UserCredits;
        if (balance < 1) {
          throw new functions.https.HttpsError('failed-precondition', 'Job seeker has insufficient credits.');
        }
        const txLogRef = seekerRef.collection('credit_transactions').doc();
        tx.update(seekerRef, { balance: balance - 1, updatedAt: serverTs });
        tx.set(txLogRef, {
          type: 'deduction', reason: 'message_rejected', amount: 1,
          balanceAfter: balance - 1, date: serverTs, referenceId: messageId,
        });
      }

      // Block job seeker from sending further messages to this employer for 30 days
      const blockRef = db
        .collection(COLLECTIONS.USERS).doc(uid)
        .collection('blocked_senders').doc(message.fromUserId);

      const blockEntry: BlockEntry = {
        blockedAt: serverTs,
        unblockAt: admin.firestore.Timestamp.fromMillis(Date.now() + THIRTY_DAYS_MS),
        reason: trimmedReason,
        messageId,
      };

      tx.update(messageRef, { status: 'rejected', rejectedAt: serverTs, rejectionReason: trimmedReason, creditDeducted: true });
      tx.set(blockRef, blockEntry);
    });

    log('Message rejected and sender blocked', { messageId, uid });

    try {
      await notifyJobSeeker(jobSeeker!.email, jobSeeker!.displayName, trimmedReason);
      log('Email sent to job seeker', { email: jobSeeker!.email });
    } catch (err: unknown) {
      functions.logger.warn('[rejectMessage] Email delivery failed', {
        messageId, error: err instanceof Error ? err.message : err,
      });
    }

    return { success: true, messageId, timestamp: serverTs };
  });
