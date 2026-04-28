import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import { sendEmailNotification } from '../notifications/emailNotification';
import type { UserCredits } from '../credits/types';
import type { UserProfile } from '../messaging/types';
import type { ExpiredMessageRow, RefundJobResult } from './types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;   // Firestore max writes per batch

const log = (msg: string, data?: object) =>
  functions.logger.info(`[refundExpiredMessages] ${msg}`, data ?? {});

// ─── Single message refund (within a transaction) ─────────────────────────────

async function refundMessage(row: ExpiredMessageRow): Promise<'refunded' | 'skipped' | 'failed'> {
  const db = getFirestore();
  const messageRef = db.collection('messages').doc(row.messageId);
  const userRef = db.collection('users').doc(row.fromUserId);
  const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

  try {
    let userEmail = '';
    let displayName = '';

    await db.runTransaction(async (tx) => {
      const [messageSnap, userSnap] = await Promise.all([
        tx.get(messageRef),
        tx.get(userRef),
      ]);

      // Re-check inside transaction — another worker may have already processed it
      const msg = messageSnap.data() ?? {};
      if (msg['status'] !== 'sent' || msg['creditRefunded'] === true) {
        throw Object.assign(new Error('skip'), { skip: true });
      }

      const { balance = 0 } = (userSnap.data() ?? {}) as UserCredits;
      const userData = (userSnap.data() ?? {}) as UserProfile & { email?: string };
      userEmail = userData.email ?? '';
      displayName = userData.displayName ?? 'there';

      const balanceAfter = balance + 1;
      const txLogRef = userRef.collection('credit_transactions').doc();

      // totalAdded tracks credits purchased/earned — do NOT increment it on refunds
      tx.update(userRef, { balance: balanceAfter, updatedAt: serverTs });
      tx.set(txLogRef, {
        type: 'refund', reason: 'message_expired_unviewed', amount: 1,
        balanceAfter, date: serverTs, referenceId: row.messageId,
      });
      tx.update(messageRef, { status: 'expired', creditRefunded: true, expiredAt: serverTs });
    });

    log('Refund applied', { messageId: row.messageId, userId: row.fromUserId });

    if (userEmail) {
      await sendEmailNotification({
        type: 'credit_refunded',
        toEmail: userEmail,
        displayName,
        credits: 1,
        reason: 'Your message expired after 7 days without a response from the recruiter.',
      });
    }

    return 'refunded';
  } catch (err: unknown) {
    if ((err as { skip?: boolean }).skip) return 'skipped';
    functions.logger.error('[refundExpiredMessages] Failed to refund message', {
      messageId: row.messageId,
      error: err instanceof Error ? err.message : err,
    });
    return 'failed';
  }
}

// ─── Scheduled Function ───────────────────────────────────────────────────────

export const refundExpiredMessages = functions
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .pubsub.schedule('0 2 * * *')
  .timeZone('UTC')
  .onRun(async () => {
    const db = getFirestore();
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - SEVEN_DAYS_MS);

    log('Job started', { cutoff: cutoff.toDate().toISOString() });

    const result: RefundJobResult = { processed: 0, refunded: 0, skipped: 0, failed: 0 };
    let lastDoc: FirebaseFirestore.DocumentSnapshot | null = null;

    // Paginate through all matching messages in BATCH_SIZE chunks
    while (true) {
      let query = db.collection('messages')
        .where('status', '==', 'sent')
        .where('createdAt', '<', cutoff)
        .orderBy('createdAt')
        .limit(BATCH_SIZE);

      if (lastDoc) query = query.startAfter(lastDoc);

      const snap = await query.get();
      if (snap.empty) break;

      const rows: ExpiredMessageRow[] = snap.docs.map((d) => ({
        messageId: d.id,
        fromUserId: d.data()['fromUserId'] ?? '',
        toUserId: d.data()['toUserId'] ?? '',
        creditDeducted: d.data()['creditDeducted'] === true,
        creditRefunded: d.data()['creditRefunded'] === true,
      }));

      // Process concurrently within the page; throttle to 10 at a time
      for (let i = 0; i < rows.length; i += 10) {
        const chunk = rows.slice(i, i + 10);
        const outcomes = await Promise.all(chunk.map(refundMessage));
        outcomes.forEach((o) => { result.processed++; result[o]++; });
      }

      lastDoc = snap.docs[snap.docs.length - 1]!;
      if (snap.docs.length < BATCH_SIZE) break;
    }

    log('Job complete', result);
  });
