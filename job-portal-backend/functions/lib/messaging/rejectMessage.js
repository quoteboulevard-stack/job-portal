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
exports.rejectMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sgMail = require("@sendgrid/mail");
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const validateEnv_1 = require("../shared/validateEnv");
const constants_1 = require("../shared/constants");
sgMail.setApiKey(validateEnv_1.config.SENDGRID_KEY);
const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME = process.env['SENDGRID_FROM_NAME'] ?? 'Your App';
const log = (msg, data) => functions.logger.info(`[rejectMessage] ${msg}`, data ?? {});
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_REASON_LENGTH = 500;
// ─── Email ────────────────────────────────────────────────────────────────────
async function notifyJobSeeker(toEmail, name, reason) {
    await sgMail.send({
        to: toEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: 'Your message request was declined',
        text: `Hi ${name},\n\n` +
            'Unfortunately, your message request has been declined by the recruiter.\n\n' +
            `Reason: ${reason}\n\n` +
            'You can explore other opportunities on the platform.\n\n' +
            'The Team',
    });
}
// ─── Callable Function ────────────────────────────────────────────────────────
exports.rejectMessage = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { messageId, reason } = data ?? {};
    if (!messageId?.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'messageId is required.');
    }
    if (!reason?.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'reason is required.');
    }
    if (reason.trim().length > MAX_REASON_LENGTH) {
        throw new functions.https.HttpsError('invalid-argument', `reason exceeds ${MAX_REASON_LENGTH} characters.`);
    }
    const uid = context.auth.uid;
    const db = (0, firebaseAdmin_1.getFirestore)();
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    const messageRef = db.collection('messages').doc(messageId);
    const trimmedReason = reason.trim();
    log('Reject request', { messageId, uid });
    let jobSeeker;
    await db.runTransaction(async (tx) => {
        const messageSnap = await tx.get(messageRef);
        if (!messageSnap.exists) {
            throw new functions.https.HttpsError('not-found', `Message ${messageId} not found.`);
        }
        const message = messageSnap.data();
        if (message.toUserId !== uid) {
            throw new functions.https.HttpsError('permission-denied', 'Only the intended recipient can reject this message.');
        }
        if (message.status === 'rejected') {
            throw new functions.https.HttpsError('already-exists', 'Message has already been rejected.');
        }
        if (message.status === 'expired') {
            throw new functions.https.HttpsError('failed-precondition', 'Cannot reject an expired message.');
        }
        const seekerRef = db.collection(constants_1.COLLECTIONS.USERS).doc(message.fromUserId);
        const seekerSnap = await tx.get(seekerRef);
        if (!seekerSnap.exists)
            throw new functions.https.HttpsError('not-found', 'Job seeker profile not found.');
        jobSeeker = seekerSnap.data();
        // Deduct credit inline — same pattern as acceptMessage.ts
        if (message.creditDeducted !== true) {
            const { balance = 0 } = (seekerSnap.data() ?? {});
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
            .collection(constants_1.COLLECTIONS.USERS).doc(uid)
            .collection('blocked_senders').doc(message.fromUserId);
        const blockEntry = {
            blockedAt: serverTs,
            unblockAt: admin.firestore.Timestamp.fromMillis(Date.now() + THIRTY_DAYS_MS),
            reason: trimmedReason,
            messageId,
        };
        tx.update(messageRef, { status: 'rejected', rejectedAt: serverTs, reason: trimmedReason, creditDeducted: true });
        tx.set(blockRef, blockEntry);
    });
    log('Message rejected and sender blocked', { messageId, uid });
    try {
        await notifyJobSeeker(jobSeeker.email, jobSeeker.displayName, trimmedReason);
        log('Email sent to job seeker', { email: jobSeeker.email });
    }
    catch (err) {
        functions.logger.warn('[rejectMessage] Email delivery failed', {
            messageId, error: err instanceof Error ? err.message : err,
        });
    }
    return { success: true, messageId, timestamp: serverTs };
});
//# sourceMappingURL=rejectMessage.js.map