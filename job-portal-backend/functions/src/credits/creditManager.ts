import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import { PAGINATION } from '../shared/constants';
import type { CreditSummary, CreditTransaction, UserCredits } from './types';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[creditManager] ${msg}`, data ?? {});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function userRef(userId: string) {
  return getFirestore().collection('users').doc(userId);
}

function txCollection(userId: string) {
  return userRef(userId).collection('credit_transactions');
}

// ─── getCredits ───────────────────────────────────────────────────────────────

export async function getCredits(userId: string): Promise<CreditSummary> {
  const snap = await userRef(userId).get();

  if (!snap.exists) {
    log('No credit document found — returning zeros', { userId });
    return { available: 0, used: 0, total: 0 };
  }

  const { balance = 0, totalAdded = 0 } = snap.data() as UserCredits;
  const available = Math.max(0, balance);
  const total = Math.max(totalAdded, available);  // guard against legacy docs missing totalAdded
  return { available, used: total - available, total };
}

// ─── addCredits ───────────────────────────────────────────────────────────────

export async function addCredits(userId: string, amount: number, reason: string): Promise<void> {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`addCredits: amount must be a positive integer, got ${amount}`);
  }

  const db = getFirestore();
  const ref = userRef(userId);
  const newTxRef = txCollection(userId).doc();
  const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? (snap.data() as UserCredits) : { balance: 0, totalAdded: 0, updatedAt: serverTs };
    const newBalance = (current.balance ?? 0) + amount;
    const newTotalAdded = (current.totalAdded ?? 0) + amount;

    const transaction: CreditTransaction = {
      type: 'topup',
      reason,
      amount,
      balanceAfter: newBalance,
      date: serverTs,
      referenceId: newTxRef.id,
    };

    tx.set(ref, { balance: newBalance, totalAdded: newTotalAdded, updatedAt: serverTs } satisfies Partial<UserCredits>, { merge: true });
    tx.set(newTxRef, transaction);
  });

  log('Credits added', { userId, amount, reason });
}

// ─── checkCredits ─────────────────────────────────────────────────────────────

export async function checkCredits(userId: string, required: number): Promise<boolean> {
  if (!Number.isInteger(required) || required < 0) {
    throw new Error(`checkCredits: required must be a non-negative integer, got ${required}`);
  }

  const snap = await userRef(userId).get();
  if (!snap.exists) return false;

  const { balance = 0 } = snap.data() as UserCredits;
  const result = balance >= required;

  log('Credit check', { userId, required, balance, result });
  return result;
}

// ─── getTransactionHistory ────────────────────────────────────────────────────

export interface TransactionPage {
  transactions: CreditTransaction[];
  nextCursor: string | null;
}

export async function getTransactionHistory(
  userId: string,
  limit = PAGINATION.DEFAULT_LIMIT,
  afterCursor?: string
): Promise<TransactionPage> {
  const pageSize = Math.min(limit, PAGINATION.MAX_LIMIT);

  let query = txCollection(userId)
    .orderBy('date', 'desc')
    .limit(pageSize + 1);  // fetch one extra to detect whether a next page exists

  if (afterCursor) {
    const cursorSnap = await txCollection(userId).doc(afterCursor).get();
    if (cursorSnap.exists) query = query.startAfter(cursorSnap);
  }

  const snap = await query.get();
  const hasMore = snap.size > pageSize;
  const docs = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;
  const nextCursor = hasMore ? docs[docs.length - 1]!.id : null;

  log('Transaction history fetched', { userId, count: docs.length, hasMore });
  return {
    transactions: docs.map((d) => d.data() as CreditTransaction),
    nextCursor,
  };
}
