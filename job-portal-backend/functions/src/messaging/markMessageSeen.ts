import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import type { MessageDocument } from './types';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[markMessageSeen] ${msg}`, data ?? {});

/**
 * Callable function: transitions a message from "sent" → "seen" when the
 * employer first views it. This triggers deductCredit.ts (onUpdate listener)
 * which handles the actual credit deduction.
 *
 * Only the intended recipient (employer) can mark a message as seen.
 * Idempotent — calling it on an already-seen message is a no-op.
 */
export const markMessageSeen = functions
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

    const messageSnap = await messageRef.get();
    if (!messageSnap.exists) {
      throw new functions.https.HttpsError('not-found', `Message ${messageId} not found.`);
    }

    const message = messageSnap.data() as MessageDocument;

    if (message.toUserId !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Only the intended recipient can mark this message as seen.');
    }

    // Idempotent: if already past "sent", do nothing
    if (message.status !== 'sent') {
      log('Already past sent status — no-op', { messageId, currentStatus: message.status });
      return { success: true, messageId, alreadySeen: true };
    }

    await messageRef.update({ status: 'seen', seenAt: serverTs });

    log('Message marked as seen', { messageId, uid });

    // The sent→seen transition fires deductCredit.ts automatically via the
    // Firestore onUpdate trigger — no inline credit logic needed here.

    return { success: true, messageId, alreadySeen: false };
  });
