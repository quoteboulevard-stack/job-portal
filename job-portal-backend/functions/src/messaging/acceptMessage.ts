import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail = require('@sendgrid/mail');
import { getFirestore } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import { COLLECTIONS } from '../shared/constants';
import type { ConversationDocument, MessageDocument, UserProfile } from './types';
import type { UserCredits } from '../credits/types';

sgMail.setApiKey(config.SENDGRID_KEY);

const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME  = process.env['SENDGRID_FROM_NAME']  ?? 'Your App';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[acceptMessage] ${msg}`, data ?? {});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// ─── Email ────────────────────────────────────────────────────────────────────

async function notifyJobSeeker(toEmail: string, name: string, employerName: string): Promise<void> {
  await sgMail.send({
    to: toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: 'Your message was accepted — chat is now open!',
    text:
      `Hi ${name},\n\n` +
      `Great news! ${employerName} has accepted your message request. ` +
      'Your chat is now open for 30 days.\n\n' +
      'Log in to continue the conversation.\n\n' +
      'The Team',
  });
}

// ─── Callable Function ────────────────────────────────────────────────────────

export const acceptMessage = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { messageId: string }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { messageId } = data ?? {};
    if (!messageId?.trim()) {
      throw new functions.https.HttpsError('invalid-argument', 'messageId is required.');
    }

    const uid = context.auth.uid;
    const db = getFirestore();
    const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;
    const messageRef = db.collection('messages').doc(messageId);

    log('Accept request', { messageId, uid });

    let jobSeeker: UserProfile;
    let employerName: string;
    let conversationId = '';

    await db.runTransaction(async (tx) => {
      const messageSnap = await tx.get(messageRef);
      if (!messageSnap.exists) {
        throw new functions.https.HttpsError('not-found', `Message ${messageId} not found.`);
      }

      const message = messageSnap.data() as MessageDocument;

      if (message.toUserId !== uid) {
        throw new functions.https.HttpsError('permission-denied', 'Only the intended recipient can accept this message.');
      }
      if (message.status === 'accepted') {
        throw new functions.https.HttpsError('already-exists', 'Message has already been accepted.');
      }
      if (message.status === 'expired') {
        throw new functions.https.HttpsError('failed-precondition', 'Cannot accept an expired message.');
      }

      const seekerRef = db.collection(COLLECTIONS.USERS).doc(message.fromUserId);
      const employerRef = db.collection(COLLECTIONS.USERS).doc(uid);
      const [seekerSnap, employerSnap] = await Promise.all([
        tx.get(seekerRef),
        tx.get(employerRef),
      ]);

      if (!seekerSnap.exists) throw new functions.https.HttpsError('not-found', 'Job seeker profile not found.');

      jobSeeker = seekerSnap.data() as UserProfile;
      employerName = employerSnap.exists ? (employerSnap.data() as UserProfile).displayName : 'The employer';

      // Deduct credit inline — deductCredit.ts only fires on sent→seen, not sent→accepted
      if (message.creditDeducted !== true) {
        const { balance = 0 } = (seekerSnap.data() ?? {}) as UserCredits;
        if (balance < 1) {
          throw new functions.https.HttpsError('failed-precondition', 'Job seeker has insufficient credits.');
        }
        const txLogRef = seekerRef.collection('credit_transactions').doc();
        tx.update(seekerRef, { balance: balance - 1, updatedAt: serverTs });
        tx.set(txLogRef, {
          type: 'deduction', reason: 'message_accepted', amount: 1,
          balanceAfter: balance - 1, date: serverTs, referenceId: messageId,
        });
      }

      const conversationRef = db.collection('conversations').doc();
      conversationId = conversationRef.id;
      const conversation: ConversationDocument = {
        messageId,
        jobSeekerId: message.fromUserId,
        employerId: uid,
        status: 'active',
        createdAt: serverTs,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + THIRTY_DAYS_MS),
      };

      tx.update(messageRef, { status: 'accepted', acceptedAt: serverTs, creditDeducted: true });
      tx.set(conversationRef, conversation);
    });

    log('Message accepted and conversation created', { messageId, uid });

    try {
      await notifyJobSeeker(jobSeeker!.email, jobSeeker!.displayName, employerName!);
      log('Email sent to job seeker', { email: jobSeeker!.email });
    } catch (err: unknown) {
      functions.logger.warn('[acceptMessage] Email delivery failed', {
        messageId, error: err instanceof Error ? err.message : err,
      });
    }

    return { success: true, messageId, conversationId, timestamp: serverTs };
  });
