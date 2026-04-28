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
exports.sendMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sgMail = require("@sendgrid/mail");
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const validateEnv_1 = require("../shared/validateEnv");
const constants_1 = require("../shared/constants");
sgMail.setApiKey(validateEnv_1.config.SENDGRID_KEY);
const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME = process.env['SENDGRID_FROM_NAME'] ?? 'Your App';
const log = (msg, data) => functions.logger.info(`[sendMessage] ${msg}`, data ?? {});
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BODY_LENGTH = 2000;
// ─── Validation ───────────────────────────────────────────────────────────────
async function validateParticipants(db, fromUserId, toUserId) {
    const [fromSnap, toSnap] = await Promise.all([
        db.collection(constants_1.COLLECTIONS.USERS).doc(fromUserId).get(),
        db.collection(constants_1.COLLECTIONS.USERS).doc(toUserId).get(),
    ]);
    if (!fromSnap.exists)
        throw new Error(`Sender not found: ${fromUserId}`);
    if (!toSnap.exists)
        throw new Error(`Recipient not found: ${toUserId}`);
    const sender = fromSnap.data();
    const receiver = toSnap.data();
    if (sender.role !== 'job_seeker') {
        throw new functions.https.HttpsError('permission-denied', 'Only job seekers can send messages.');
    }
    if (receiver.role !== 'employer') {
        throw new functions.https.HttpsError('permission-denied', 'Messages can only be sent to employers.');
    }
    return { sender, receiver };
}
// ─── Email ────────────────────────────────────────────────────────────────────
async function notifyEmployerByEmail(toEmail, employerName, senderName, messageId) {
    await sgMail.send({
        to: toEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `New message request from ${senderName}`,
        text: `Hi ${employerName},\n\n` +
            `You have a new message request from ${senderName}.\n\n` +
            `Message ID: ${messageId}\n` +
            'Log in to your inbox to view and respond.\n\n' +
            'This message will expire in 7 days if not viewed.\n\n' +
            'The Team',
    });
}
// ─── Cloud Function ───────────────────────────────────────────────────────────
exports.sendMessage = functions
    .runWith({ timeoutSeconds: constants_1.TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
    .firestore.document('messages/{messageId}')
    .onCreate(async (snap, context) => {
    const { messageId } = context.params;
    const data = snap.data();
    const { fromUserId, toUserId, body } = data;
    const db = (0, firebaseAdmin_1.getFirestore)();
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    const fail = async (msg) => {
        functions.logger.error(`[sendMessage] Validation failed: ${msg}`, { messageId });
        await snap.ref.update({ status: 'invalid', error: msg, updatedAt: serverTs });
    };
    if (!fromUserId || !toUserId)
        return fail('Missing fromUserId or toUserId.');
    if (!body?.trim())
        return fail('Message body cannot be empty.');
    if (body.trim().length > MAX_BODY_LENGTH)
        return fail(`Message exceeds ${MAX_BODY_LENGTH} characters.`);
    if (fromUserId === toUserId)
        return fail('Sender and recipient cannot be the same user.');
    let sender;
    let receiver;
    try {
        ({ sender, receiver } = await validateParticipants(db, fromUserId, toUserId));
    }
    catch (err) {
        return fail(err instanceof Error ? err.message : 'Participant validation failed.');
    }
    log('Validated participants', { messageId, fromUserId, toUserId });
    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + SEVEN_DAYS_MS);
    const notification = {
        type: 'new_message',
        messageId,
        fromUserId,
        fromName: sender.displayName,
        toUserId: toUserId,
        read: false,
        createdAt: serverTs,
    };
    await Promise.all([
        snap.ref.update({
            status: 'sent',
            expiresAt,
            createdAt: serverTs,
            creditDeducted: false,
            creditRefunded: false,
        }),
        db.collection(constants_1.COLLECTIONS.NOTIFICATIONS).add(notification),
    ]);
    log('Message sent and notification created', { messageId });
    try {
        await notifyEmployerByEmail(receiver.email, receiver.displayName, sender.displayName, messageId);
        log('Email sent to employer', { toUserId, email: receiver.email });
    }
    catch (err) {
        // Email failure must not roll back the message — log and continue
        functions.logger.warn('[sendMessage] Email delivery failed', {
            messageId,
            error: err instanceof Error ? err.message : err,
        });
    }
    return { success: true, messageId, timestamp: serverTs };
});
//# sourceMappingURL=sendMessage.js.map