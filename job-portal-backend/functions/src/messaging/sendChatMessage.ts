import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import { TIMEOUTS } from '../shared/constants';
import type { ConversationDocument } from './types';

const MAX_MESSAGE_LENGTH = 2_000;

const log = (msg: string, data?: object) =>
  functions.logger.info(`[sendChatMessage] ${msg}`, data ?? {});

export const sendChatMessage = functions
  .runWith({ timeoutSeconds: TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
  .https.onCall(async (
    data: { conversationId: string; text: string },
    context
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid            = context.auth.uid;
    const conversationId = String(data?.conversationId ?? '').trim();
    const text           = String(data?.text           ?? '').trim();

    if (!conversationId) {
      throw new functions.https.HttpsError('invalid-argument', 'conversationId is required.');
    }
    if (!text) {
      throw new functions.https.HttpsError('invalid-argument', 'text cannot be empty.');
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Message exceeds the ${MAX_MESSAGE_LENGTH}-character limit.`
      );
    }

    const db = getFirestore();
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationSnap = await conversationRef.get();

    if (!conversationSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Conversation not found.');
    }

    const conversation = conversationSnap.data() as ConversationDocument;

    if (conversation.status !== 'active') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This conversation is no longer active.'
      );
    }

    if (uid !== conversation.jobSeekerId && uid !== conversation.employerId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You are not a participant in this conversation.'
      );
    }

    // Check expiry against server time
    const now = admin.firestore.Timestamp.now();
    if (conversation.expiresAt && conversation.expiresAt.toMillis() < now.toMillis()) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'This conversation has expired.'
      );
    }

    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    const messageRef = conversationRef.collection('messages').doc();

    await db.runTransaction(async (tx) => {
      tx.set(messageRef, {
        senderId: uid,
        text,
        sentAt: serverTs,
        readBy: [uid],
      });
      tx.update(conversationRef, {
        lastMessage: text,
        lastMessageAt: serverTs,
      });
    });

    log('Chat message sent', { conversationId, messageId: messageRef.id, uid });
    return { success: true, messageId: messageRef.id };
  });
