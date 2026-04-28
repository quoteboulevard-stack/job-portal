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
exports.deductCredit = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const log = (msg, data) => functions.logger.info(`[deductCredit] ${msg}`, data ?? {});
// ─── Cloud Function ───────────────────────────────────────────────────────────
exports.deductCredit = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .firestore.document('messages/{messageId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Only process sent → seen transitions that haven't been charged yet
    if (before.status !== 'sent' || after.status !== 'seen' || after.creditDeducted === true) {
        return;
    }
    const { messageId } = context.params;
    const { fromUserId } = after;
    if (!fromUserId) {
        functions.logger.error('[deductCredit] Missing fromUserId', { messageId });
        return;
    }
    log('Deducting credit', { messageId, fromUserId });
    const db = (0, firebaseAdmin_1.getFirestore)();
    const userRef = db.collection('users').doc(fromUserId);
    const txLogRef = userRef.collection('credit_transactions').doc();
    const messageRef = change.after.ref;
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    try {
        await db.runTransaction(async (tx) => {
            const userSnap = await tx.get(userRef);
            if (!userSnap.exists) {
                throw new Error(`User document not found: ${fromUserId}`);
            }
            const { balance } = userSnap.data();
            if (typeof balance !== 'number' || balance < 1) {
                throw new InsufficientCreditsError(balance ?? 0);
            }
            const balanceAfter = balance - 1;
            const transaction = {
                type: 'deduction',
                reason: 'message_viewed',
                amount: 1,
                balanceAfter,
                date: serverTs,
                referenceId: messageId,
            };
            tx.update(userRef, { balance: balanceAfter, updatedAt: serverTs });
            tx.set(txLogRef, transaction);
            tx.update(messageRef, { creditDeducted: true, creditsDeductedAt: serverTs });
        });
        log('Credit deducted successfully', { messageId, fromUserId });
    }
    catch (err) {
        if (err instanceof InsufficientCreditsError) {
            functions.logger.warn('[deductCredit] Insufficient credits', {
                messageId,
                fromUserId,
                balance: err.balance,
            });
            // Mark message so we don't retry on subsequent triggers
            await change.after.ref.update({ creditDeducted: false, creditError: 'insufficient_credits' });
            return;
        }
        functions.logger.error('[deductCredit] Transaction failed', {
            messageId,
            fromUserId,
            error: err instanceof Error ? err.message : err,
        });
        // Rethrow — Cloud Functions will retry with exponential backoff
        throw err;
    }
});
// ─── Errors ───────────────────────────────────────────────────────────────────
class InsufficientCreditsError extends Error {
    constructor(balance) {
        super(`Insufficient credits: balance is ${balance}`);
        this.balance = balance;
        this.name = 'InsufficientCreditsError';
    }
}
//# sourceMappingURL=deductCredit.js.map