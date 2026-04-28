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
exports.acceptMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sgMail = require("@sendgrid/mail");
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const validateEnv_1 = require("../shared/validateEnv");
const constants_1 = require("../shared/constants");
sgMail.setApiKey(validateEnv_1.config.SENDGRID_KEY);
const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME = process.env['SENDGRID_FROM_NAME'] ?? 'Your App';
const log = (msg, data) => functions.logger.info(`[acceptMessage] ${msg}`, data ?? {});
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// ─── Email ────────────────────────────────────────────────────────────────────
async function notifyJobSeeker(toEmail, name, employerName) {
    await sgMail.send({
        to: toEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: 'Your message was accepted — chat is now open!',
        text: `Hi ${name},\n\n` +
            `Great news! ${employerName} has accepted your message request. ` +
            'Your chat is now open for 30 days.\n\n' +
            'Log in to continue the conversation.\n\n' +
            'The Team',
    });
}
// ─── Callable Function ────────────────────────────────────────────────────────
exports.acceptMessage = functions
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
    log('Accept request', { messageId, uid });
    let jobSeeker;
    let employerName;
    let conversationId = '';
    await db.runTransaction(async (tx) => {
        const messageSnap = await tx.get(messageRef);
        if (!messageSnap.exists) {
            throw new functions.https.HttpsError('not-found', `Message ${messageId} not found.`);
        }
        const message = messageSnap.data();
        if (message.toUserId !== uid) {
            throw new functions.https.HttpsError('permission-denied', 'Only the intended recipient can accept this message.');
        }
        if (message.status === 'accepted') {
            throw new functions.https.HttpsError('already-exists', 'Message has already been accepted.');
        }
        if (message.status === 'expired') {
            throw new functions.https.HttpsError('failed-precondition', 'Cannot accept an expired message.');
        }
        const seekerRef = db.collection(constants_1.COLLECTIONS.USERS).doc(message.fromUserId);
        const employerRef = db.collection(constants_1.COLLECTIONS.USERS).doc(uid);
        const [seekerSnap, employerSnap] = await Promise.all([
            tx.get(seekerRef),
            tx.get(employerRef),
        ]);
        if (!seekerSnap.exists)
            throw new functions.https.HttpsError('not-found', 'Job seeker profile not found.');
        jobSeeker = seekerSnap.data();
        employerName = employerSnap.exists ? employerSnap.data().displayName : 'The employer';
        // Deduct credit inline — deductCredit.ts only fires on sent→seen, not sent→accepted
        if (message.creditDeducted !== true) {
            const { balance = 0 } = (seekerSnap.data() ?? {});
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
        const conversation = {
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
        await notifyJobSeeker(jobSeeker.email, jobSeeker.displayName, employerName);
        log('Email sent to job seeker', { email: jobSeeker.email });
    }
    catch (err) {
        functions.logger.warn('[acceptMessage] Email delivery failed', {
            messageId, error: err instanceof Error ? err.message : err,
        });
    }
    return { success: true, messageId, conversationId, timestamp: serverTs };
});
//# sourceMappingURL=acceptMessage.js.map