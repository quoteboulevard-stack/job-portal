import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import type { CreditTransaction, MessageData, UserCredits } from './types';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[deductCredit] ${msg}`, data ?? {});

// ─── Cloud Function ───────────────────────────────────────────────────────────

export const deductCredit = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .firestore.document('messages/{messageId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() as MessageData;
    const after = change.after.data() as MessageData;

    // Only process sent → seen transitions that haven't been charged yet
    if (before.status !== 'sent' || after.status !== 'seen' || after.creditDeducted === true) {
      return;
    }

    const { messageId } = context.params;
    const { fromUserId } = after;

    if (!fromUserId) {
      functions.logger.error('[deductCredit] Missing fromUserId', { messageId });
      return;
    }

    log('Deducting credit', { messageId, fromUserId });

    const db = getFirestore();
    const userRef = db.collection('users').doc(fromUserId);
    const txLogRef = userRef.collection('credit_transactions').doc();
    const messageRef = change.after.ref;
    const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

    try {
      await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);

        if (!userSnap.exists) {
          throw new Error(`User document not found: ${fromUserId}`);
        }

        const { balance } = userSnap.data() as UserCredits;

        if (typeof balance !== 'number' || balance < 1) {
          throw new InsufficientCreditsError(balance ?? 0);
        }

        const balanceAfter = balance - 1;

        const transaction: CreditTransaction = {
          type: 'deduction',
          reason: 'message_viewed',
          amount: 1,
          balanceAfter,
          date: serverTs,
          referenceId: messageId,
        };

        tx.update(userRef, { balance: balanceAfter, updatedAt: serverTs } satisfies Partial<UserCredits>);
        tx.set(txLogRef, transaction);
        tx.update(messageRef, { creditDeducted: true, creditsDeductedAt: serverTs });
      });

      log('Credit deducted successfully', { messageId, fromUserId });
    } catch (err: unknown) {
      if (err instanceof InsufficientCreditsError) {
        functions.logger.warn('[deductCredit] Insufficient credits', {
          messageId,
          fromUserId,
          balance: err.balance,
        });
        // Mark message so we don't retry on subsequent triggers
        await change.after.ref.update({ creditDeducted: false, creditError: 'insufficient_credits' });
        return;
      }
      functions.logger.error('[deductCredit] Transaction failed', {
        messageId,
        fromUserId,
        error: err instanceof Error ? err.message : err,
      });
      // Rethrow — Cloud Functions will retry with exponential backoff
      throw err;
    }
  });

// ─── Errors ───────────────────────────────────────────────────────────────────

class InsufficientCreditsError extends Error {
  constructor(public readonly balance: number) {
    super(`Insufficient credits: balance is ${balance}`);
    this.name = 'InsufficientCreditsError';
  }
}
