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
exports.refundCredit = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sgMail = require("@sendgrid/mail");
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const validateEnv_1 = require("../shared/validateEnv");
sgMail.setApiKey(validateEnv_1.config.SENDGRID_KEY);
const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME = process.env['SENDGRID_FROM_NAME'] ?? 'Your App';
const log = (msg, data) => functions.logger.info(`[refundCredit] ${msg}`, data ?? {});
// ─── Email notification ───────────────────────────────────────────────────────
async function sendRefundEmail(toEmail, displayName) {
    await sgMail.send({
        to: toEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: 'Credit refunded — HR didn\'t view your message',
        text: `Hi ${displayName},\n\n` +
            'Your message expired after 7 days without being viewed by the recruiter. ' +
            'We\'ve refunded 1 credit to your account.\n\n' +
            'You can use it to reach out to another opportunity.\n\n' +
            'The Team',
    });
}
// ─── Cloud Function ───────────────────────────────────────────────────────────
exports.refundCredit = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .firestore.document('messages/{messageId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Only process sent → expired; skip if already refunded or credits were deducted (message was seen)
    if (before.status !== 'sent' || after.status !== 'expired' || after.creditRefunded === true)
        return;
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
    const db = (0, firebaseAdmin_1.getFirestore)();
    const userRef = db.collection('users').doc(fromUserId);
    const txLogRef = userRef.collection('credit_transactions').doc();
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    try {
        let userEmail = '';
        let displayName = '';
        await db.runTransaction(async (tx) => {
            const userSnap = await tx.get(userRef);
            if (!userSnap.exists)
                throw new Error(`User not found: ${fromUserId}`);
            const userData = userSnap.data();
            const balance = typeof userData.balance === 'number' ? userData.balance : 0;
            const balanceAfter = balance + 1;
            userEmail = userData.email ?? '';
            displayName = userData.displayName ?? 'there';
            const transaction = {
                type: 'refund',
                reason: 'message_expired_unviewed',
                amount: 1,
                balanceAfter,
                date: serverTs,
                referenceId: messageId,
            };
            tx.update(userRef, { balance: balanceAfter, updatedAt: serverTs });
            tx.set(txLogRef, transaction);
            tx.update(change.after.ref, { creditRefunded: true, creditRefundedAt: serverTs });
        });
        log('Refund applied', { messageId, fromUserId });
        if (userEmail) {
            await sendRefundEmail(userEmail, displayName);
            log('Refund email sent', { fromUserId, userEmail });
        }
        else {
            functions.logger.warn('[refundCredit] No email on user record — skipping email', { fromUserId });
        }
    }
    catch (err) {
        functions.logger.error('[refundCredit] Failed', {
            messageId,
            fromUserId,
            error: err instanceof Error ? err.message : err,
        });
        throw err;
    }
});
//# sourceMappingURL=refundCredit.js.map