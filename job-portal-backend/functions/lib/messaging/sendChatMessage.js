"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChatMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const constants_1 = require("../shared/constants");
const MAX_MESSAGE_LENGTH = 2000;
const log = (msg, data) => functions.logger.info(`[sendChatMessage] ${msg}`, data ?? {});
exports.sendChatMessage = functions
    .runWith({ timeoutSeconds: constants_1.TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = context.auth.uid;
    const conversationId = String(data?.conversationId ?? '').trim();
    const text = String(data?.text ?? '').trim();
    if (!conversationId) {
        throw new functions.https.HttpsError('invalid-argument', 'conversationId is required.');
    }
    if (!text) {
        throw new functions.https.HttpsError('invalid-argument', 'text cannot be empty.');
    }
    if (text.length > MAX_MESSAGE_LENGTH) {
        throw new functions.https.HttpsError('invalid-argument', `Message exceeds the ${MAX_MESSAGE_LENGTH}-character limit.`);
    }
    const db = (0, firebaseAdmin_1.getFirestore)();
    const conversationRef = db.collection('conversations').doc(conversationId);
    const conversationSnap = await conversationRef.get();
    if (!conversationSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Conversation not found.');
    }
    const conversation = conversationSnap.data();
    if (conversation.status !== 'active') {
        throw new functions.https.HttpsError('failed-precondition', 'This conversation is no longer active.');
    }
    if (uid !== conversation.jobSeekerId && uid !== conversation.employerId) {
        throw new functions.https.HttpsError('permission-denied', 'You are not a participant in this conversation.');
    }
    // Check expiry against server time
    const now = admin.firestore.Timestamp.now();
    if (conversation.expiresAt && conversation.expiresAt.toMillis() < now.toMillis()) {
        throw new functions.https.HttpsError('failed-precondition', 'This conversation has expired.');
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
//# sourceMappingURL=sendChatMessage.js.map