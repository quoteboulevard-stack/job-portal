import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail = require('@sendgrid/mail');
import { getFirestore } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import type { CreditTransaction, MessageData, UserCredits } from './types';

sgMail.setApiKey(config.SENDGRID_KEY);

const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME  = process.env['SENDGRID_FROM_NAME']  ?? 'Your App';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[refundCredit] ${msg}`, data ?? {});

// ─── Email notification ───────────────────────────────────────────────────────

async function sendRefundEmail(toEmail: string, displayName: string): Promise<void> {
  await sgMail.send({
    to: toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: 'Credit refunded — HR didn\'t view your message',
    text:
      `Hi ${displayName},\n\n` +
      'Your message expired after 7 days without being viewed by the recruiter. ' +
      'We\'ve refunded 1 credit to your account.\n\n' +
      'You can use it to reach out to another opportunity.\n\n' +
      'The Team',
  });
}

// ─── Cloud Function ───────────────────────────────────────────────────────────

export const refundCredit = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .firestore.document('messages/{messageId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as MessageData;
    const after = change.after.data() as MessageData;

    // Only process sent → expired; skip if already refunded or credits were deducted (message was seen)
    if (before.status !== 'sent' || after.status !== 'expired' || after.creditRefunded === true) return;
    if (after.creditDeducted === true) {
      log('Credit already deducted — no refund', { messageId: context.params['messageId'] });
      return;
    }

    const { messageId } = context.params;
    const { fromUserId } = after;

    if (!fromUserId) {
      functions.logger.error('[refundCredit] Missing fromUserId', { messageId });
      return;
    }

    log('Processing refund', { messageId, fromUserId });

    const db = getFirestore();
    const userRef = db.collection('users').doc(fromUserId);
    const txLogRef = userRef.collection('credit_transactions').doc();
    const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

    try {
      let userEmail = '';
      let displayName = '';

      await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists) throw new Error(`User not found: ${fromUserId}`);

        const userData = userSnap.data() as UserCredits & { email?: string; displayName?: string };
        const balance = typeof userData.balance === 'number' ? userData.balance : 0;
        const balanceAfter = balance + 1;

        userEmail = userData.email ?? '';
        displayName = userData.displayName ?? 'there';

        const transaction: CreditTransaction = {
          type: 'refund',
          reason: 'message_expired_unviewed',
          amount: 1,
          balanceAfter,
          date: serverTs,
          referenceId: messageId,
        };

        tx.update(userRef, { balance: balanceAfter, updatedAt: serverTs } satisfies Partial<UserCredits>);
        tx.set(txLogRef, transaction);
        tx.update(change.after.ref, { creditRefunded: true, creditRefundedAt: serverTs });
      });

      log('Refund applied', { messageId, fromUserId });

      if (userEmail) {
        await sendRefundEmail(userEmail, displayName);
        log('Refund email sent', { fromUserId, userEmail });
      } else {
        functions.logger.warn('[refundCredit] No email on user record — skipping email', { fromUserId });
      }
    } catch (err: unknown) {
      functions.logger.error('[refundCredit] Failed', {
        messageId,
        fromUserId,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  });
