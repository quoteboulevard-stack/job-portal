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
exports.refundExpiredMessages = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const emailNotification_1 = require("../notifications/emailNotification");
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100; // Firestore max writes per batch
const log = (msg, data) => functions.logger.info(`[refundExpiredMessages] ${msg}`, data ?? {});
// ─── Single message refund (within a transaction) ─────────────────────────────
async function refundMessage(row) {
    const db = (0, firebaseAdmin_1.getFirestore)();
    const messageRef = db.collection('messages').doc(row.messageId);
    const userRef = db.collection('users').doc(row.fromUserId);
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
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
            const { balance = 0 } = (userSnap.data() ?? {});
            const userData = (userSnap.data() ?? {});
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
            await (0, emailNotification_1.sendEmailNotification)({
                type: 'credit_refunded',
                toEmail: userEmail,
                displayName,
                credits: 1,
                reason: 'Your message expired after 7 days without a response from the recruiter.',
            });
        }
        return 'refunded';
    }
    catch (err) {
        if (err.skip)
            return 'skipped';
        functions.logger.error('[refundExpiredMessages] Failed to refund message', {
            messageId: row.messageId,
            error: err instanceof Error ? err.message : err,
        });
        return 'failed';
    }
}
// ─── Scheduled Function ───────────────────────────────────────────────────────
exports.refundExpiredMessages = functions
    .runWith({ timeoutSeconds: 540, memory: '512MB' })
    .pubsub.schedule('0 2 * * *')
    .timeZone('UTC')
    .onRun(async () => {
    const db = (0, firebaseAdmin_1.getFirestore)();
    const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - SEVEN_DAYS_MS);
    log('Job started', { cutoff: cutoff.toDate().toISOString() });
    const result = { processed: 0, refunded: 0, skipped: 0, failed: 0 };
    let lastDoc = null;
    // Paginate through all matching messages in BATCH_SIZE chunks
    while (true) {
        let query = db.collection('messages')
            .where('status', '==', 'sent')
            .where('createdAt', '<', cutoff)
            .orderBy('createdAt')
            .limit(BATCH_SIZE);
        if (lastDoc)
            query = query.startAfter(lastDoc);
        const snap = await query.get();
        if (snap.empty)
            break;
        const rows = snap.docs.map((d) => ({
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
        lastDoc = snap.docs[snap.docs.length - 1];
        if (snap.docs.length < BATCH_SIZE)
            break;
    }
    log('Job complete', result);
});
//# sourceMappingURL=refundExpiredMessages.js.map