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
exports.getCredits = getCredits;
exports.addCredits = addCredits;
exports.checkCredits = checkCredits;
exports.getTransactionHistory = getTransactionHistory;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const constants_1 = require("../shared/constants");
const log = (msg, data) => functions.logger.info(`[creditManager] ${msg}`, data ?? {});
// ─── Helpers ──────────────────────────────────────────────────────────────────
function userRef(userId) {
    return (0, firebaseAdmin_1.getFirestore)().collection('users').doc(userId);
}
function txCollection(userId) {
    return userRef(userId).collection('credit_transactions');
}
// ─── getCredits ───────────────────────────────────────────────────────────────
async function getCredits(userId) {
    const snap = await userRef(userId).get();
    if (!snap.exists) {
        log('No credit document found — returning zeros', { userId });
        return { available: 0, used: 0, total: 0 };
    }
    const { balance = 0, totalAdded = 0 } = snap.data();
    const available = Math.max(0, balance);
    const total = Math.max(totalAdded, available); // guard against legacy docs missing totalAdded
    return { available, used: total - available, total };
}
// ─── addCredits ───────────────────────────────────────────────────────────────
async function addCredits(userId, amount, reason) {
    if (!Number.isInteger(amount) || amount <= 0) {
        throw new Error(`addCredits: amount must be a positive integer, got ${amount}`);
    }
    const db = (0, firebaseAdmin_1.getFirestore)();
    const ref = userRef(userId);
    const newTxRef = txCollection(userId).doc();
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const current = snap.exists ? snap.data() : { balance: 0, totalAdded: 0, updatedAt: serverTs };
        const newBalance = (current.balance ?? 0) + amount;
        const newTotalAdded = (current.totalAdded ?? 0) + amount;
        const transaction = {
            type: 'topup',
            reason,
            amount,
            balanceAfter: newBalance,
            date: serverTs,
            referenceId: newTxRef.id,
        };
        tx.set(ref, { balance: newBalance, totalAdded: newTotalAdded, updatedAt: serverTs }, { merge: true });
        tx.set(newTxRef, transaction);
    });
    log('Credits added', { userId, amount, reason });
}
// ─── checkCredits ─────────────────────────────────────────────────────────────
async function checkCredits(userId, required) {
    if (!Number.isInteger(required) || required < 0) {
        throw new Error(`checkCredits: required must be a non-negative integer, got ${required}`);
    }
    const snap = await userRef(userId).get();
    if (!snap.exists)
        return false;
    const { balance = 0 } = snap.data();
    const result = balance >= required;
    log('Credit check', { userId, required, balance, result });
    return result;
}
async function getTransactionHistory(userId, limit = constants_1.PAGINATION.DEFAULT_LIMIT, afterCursor) {
    const pageSize = Math.min(limit, constants_1.PAGINATION.MAX_LIMIT);
    let query = txCollection(userId)
        .orderBy('date', 'desc')
        .limit(pageSize + 1); // fetch one extra to detect whether a next page exists
    if (afterCursor) {
        const cursorSnap = await txCollection(userId).doc(afterCursor).get();
        if (cursorSnap.exists)
            query = query.startAfter(cursorSnap);
    }
    const snap = await query.get();
    const hasMore = snap.size > pageSize;
    const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
    const nextCursor = hasMore ? docs[docs.length - 1].id : null;
    log('Transaction history fetched', { userId, count: docs.length, hasMore });
    return {
        transactions: docs.map((d) => d.data()),
        nextCursor,
    };
}
//# sourceMappingURL=creditManager.js.map