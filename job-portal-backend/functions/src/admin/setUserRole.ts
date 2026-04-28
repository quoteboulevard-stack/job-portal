import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';

type UserRole = 'job_seeker' | 'employer' | 'admin';
const ALLOWED_ROLES: UserRole[] = ['job_seeker', 'employer', 'admin'];

const log = (msg: string, data?: object) =>
  functions.logger.info(`[setUserRole] ${msg}`, data ?? {});

export const setUserRole = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { uid: string; role: UserRole }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const db = getFirestore();
    const callerSnap = await db.collection('users').doc(context.auth.uid).get();
    if (!callerSnap.exists || callerSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Admin role required.');
    }

    const { uid, role } = data ?? {};
    if (!uid || typeof uid !== 'string') {
      throw new functions.https.HttpsError('invalid-argument', 'uid is required.');
    }
    if (!ALLOWED_ROLES.includes(role)) {
      throw new functions.https.HttpsError('invalid-argument', `role must be one of: ${ALLOWED_ROLES.join(', ')}.`);
    }

    const targetSnap = await db.collection('users').doc(uid).get();
    if (!targetSnap.exists) {
      throw new functions.https.HttpsError('not-found', `User ${uid} not found.`);
    }

    await db.collection('users').doc(uid).set(
      { role, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    log('Role updated', { targetUid: uid, role, byAdmin: context.auth.uid });
    return { success: true };
  });
