import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';

const BATCH_SIZE = 400;

const log = (msg: string, data?: object) =>
  functions.logger.info(`[migrateFieldNames] ${msg}`, data ?? {});

// ─── messages: reason → rejectionReason ──────────────────────────────────────
// rejectMessage.ts previously wrote `reason` to the message document.
// The canonical field name is `rejectionReason` (matching the shared-lib Message
// type and all client mappers). This migration copies `reason` → `rejectionReason`
// and deletes the old key on every rejected message that still has the old field.

async function migrateMessageRejectionReason(
  db: FirebaseFirestore.Firestore
): Promise<number> {
  let migrated = 0;

  // Query in pages; FieldPath lets us filter on the presence of the legacy key.
  let query = db
    .collection('messages')
    .where('status', '==', 'rejected')
    .where('reason', '!=', null)   // documents that still carry the old field
    .limit(BATCH_SIZE);

  while (true) {
    const snap = await query.get();
    if (snap.empty) break;

    const batch = db.batch();
    for (const doc of snap.docs) {
      const data = doc.data();
      // Only migrate docs that have `reason` but not yet `rejectionReason`.
      if (data['reason'] !== undefined && data['rejectionReason'] === undefined) {
        batch.update(doc.ref, {
          rejectionReason: data['reason'],
          reason: admin.firestore.FieldValue.delete(),
        });
        migrated++;
      }
    }
    await batch.commit();

    if (snap.size < BATCH_SIZE) break;
    query = query.startAfter(snap.docs[snap.size - 1]!);
  }

  log('messages reason→rejectionReason done', { migrated });
  return migrated;
}

// ─── Callable (admin-only, one-time) ─────────────────────────────────────────

export const migrateFieldNames = functions
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .https.onCall(async (_data, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const db = getFirestore();

    // Verify caller is an admin before running destructive migration.
    const callerSnap = await db.collection('users').doc(context.auth.uid).get();
    if (!callerSnap.exists || (callerSnap.data() as Record<string, unknown>)['role'] !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can run migrations.');
    }

    log('Migration started', { uid: context.auth.uid });

    const messagesFixed = await migrateMessageRejectionReason(db);

    const result = { messagesFixed };
    log('Migration complete', result);
    return result;
  });
