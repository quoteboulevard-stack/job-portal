import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[initUserCredits] ${msg}`, data ?? {});

/**
 * Firestore onCreate trigger: initializes financial fields on new user
 * profiles. This runs server-side via Admin SDK (bypasses rules) so clients
 * can never set their own balance.
 *
 * Idempotent — if balance/totalAdded already exist (shouldn't happen from
 * client rules, but safe against Admin SDK or migration writes), this is
 * a no-op.
 */
export const initUserCredits = functions
  .runWith({ timeoutSeconds: 10, memory: '128MB' })
  .firestore.document('users/{userId}')
  .onCreate(async (snap, context) => {
    const { userId } = context.params;
    const data = snap.data();

    // Guard: if financial fields already present, do nothing
    if (typeof data.balance === 'number' && typeof data.totalAdded === 'number') {
      log('Financial fields already present — skipping', { userId });
      return;
    }

    const serverTs = admin.firestore.FieldValue.serverTimestamp();

    await getFirestore().collection('users').doc(userId).update({
      balance: 0,
      totalAdded: 0,
      updatedAt: serverTs,
    });

    log('Financial fields initialized', { userId, balance: 0, totalAdded: 0 });
  });
