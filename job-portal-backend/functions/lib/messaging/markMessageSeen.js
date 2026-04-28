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
exports.markMessageSeen = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const log = (msg, data) => functions.logger.info(`[markMessageSeen] ${msg}`, data ?? {});
/**
 * Callable function: transitions a message from "sent" → "seen" when the
 * employer first views it. This triggers deductCredit.ts (onUpdate listener)
 * which handles the actual credit deduction.
 *
 * Only the intended recipient (employer) can mark a message as seen.
 * Idempotent — calling it on an already-seen message is a no-op.
 */
exports.markMessageSeen = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { messageId } = data ?? {};
    if (!messageId?.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'messageId is required.');
    }
    const uid = context.auth.uid;
    const db = (0, firebaseAdmin_1.getFirestore)();
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    const messageRef = db.collection('messages').doc(messageId);
    const messageSnap = await messageRef.get();
    if (!messageSnap.exists) {
        throw new functions.https.HttpsError('not-found', `Message ${messageId} not found.`);
    }
    const message = messageSnap.data();
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
//# sourceMappingURL=markMessageSeen.js.map