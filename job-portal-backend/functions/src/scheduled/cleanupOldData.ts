import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore, getStorage } from '../shared/firebaseAdmin';
import type { CleanupResult } from './types';

const NINETY_DAYS_MS  = 90 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS  = 30 * 24 * 60 * 60 * 1000;
const BATCH_SIZE      = 100;
const ARCHIVE_BUCKET  = process.env.FIREBASE_STORAGE_BUCKET ?? '';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[cleanupOldData] ${msg}`, data ?? {});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function deletePage(
  query: FirebaseFirestore.Query,
  db: FirebaseFirestore.Firestore
): Promise<number> {
  const snap = await query.limit(BATCH_SIZE).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

async function deleteAll(query: FirebaseFirestore.Query, db: FirebaseFirestore.Firestore): Promise<number> {
  let total = 0;
  while (true) {
    const deleted = await deletePage(query, db);
    total += deleted;
    if (deleted < BATCH_SIZE) break;
  }
  return total;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

async function deleteOldConversations(db: FirebaseFirestore.Firestore): Promise<number> {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - NINETY_DAYS_MS);
  const query = db.collection('conversations')
    .where('status', '!=', 'active')
    .where('createdAt', '<', cutoff);
  const count = await deleteAll(query, db);
  log('Old conversations deleted', { count, cutoffDays: 90 });
  return count;
}

async function deleteRejectedMessages(db: FirebaseFirestore.Firestore): Promise<number> {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - THIRTY_DAYS_MS);
  const query = db.collection('messages')
    .where('status', '==', 'rejected')
    .where('rejectedAt', '<', cutoff);
  const count = await deleteAll(query, db);
  log('Rejected messages deleted', { count, cutoffDays: 30 });
  return count;
}

async function archiveOldChats(db: FirebaseFirestore.Firestore): Promise<number> {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - NINETY_DAYS_MS);
  const snap = await db.collection('chats')
    .where('lastMessageAt', '<', cutoff)
    .limit(BATCH_SIZE)
    .get();

  if (snap.empty) return 0;

  const bucket = getStorage().bucket(ARCHIVE_BUCKET);
  const firestoreBatch = db.batch();
  let archived = 0;

  // Archive each chat first; only add to the delete batch if the archive succeeded.
  // This prevents data loss when Storage is temporarily unavailable.
  const results = await Promise.allSettled(
    snap.docs.map(async (doc) => {
      const archivePath = `archives/chats/${doc.id}.json`;
      await bucket.file(archivePath).save(JSON.stringify({ id: doc.id, ...doc.data() }), {
        contentType: 'application/json',
        metadata: { archivedAt: new Date().toISOString() },
      });
      return doc;
    })
  );

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      firestoreBatch.delete(result.value.ref);
      archived++;
    } else {
      functions.logger.error('[cleanupOldData] Failed to archive chat — Firestore doc retained', {
        chatId: snap.docs[i]!.id,
        error: result.reason instanceof Error ? result.reason.message : result.reason,
      });
    }
  });

  await firestoreBatch.commit();
  log('Chats archived', { archived });
  return archived;
}

async function deleteExpiredUploads(): Promise<number> {
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS);
  const bucket = getStorage().bucket(ARCHIVE_BUCKET);

  // List files under temp/ prefix — staging area for uploads pending processing
  const [files] = await bucket.getFiles({ prefix: 'temp/' });
  const expired = files.filter((f) => {
    const updated = f.metadata?.updated ? new Date(f.metadata.updated as string) : null;
    return updated && updated < cutoff;
  });

  if (expired.length === 0) return 0;

  await Promise.all(expired.map((f) => f.delete().catch((err: unknown) => {
    functions.logger.error('[cleanupOldData] Failed to delete upload', {
      file: f.name, error: err instanceof Error ? err.message : err,
    });
  })));

  log('Expired uploads deleted', { count: expired.length });
  return expired.length;
}

// ─── Scheduled Function ───────────────────────────────────────────────────────

export const cleanupOldData = functions
  .runWith({ timeoutSeconds: 540, memory: '512MB' })
  .pubsub.schedule('0 2 * * 0')   // Sunday 2 AM UTC
  .timeZone('UTC')
  .onRun(async () => {
    log('Job started');
    const db = getFirestore();
    const result: CleanupResult = {
      conversationsDeleted: 0, rejectedMessagesDeleted: 0,
      chatsArchived: 0, uploadsDeleted: 0, errors: 0,
    };

    const tasks: Array<[keyof CleanupResult, () => Promise<number>]> = [
      ['conversationsDeleted',   () => deleteOldConversations(db)],
      ['rejectedMessagesDeleted', () => deleteRejectedMessages(db)],
      ['chatsArchived',          () => archiveOldChats(db)],
      ['uploadsDeleted',         () => deleteExpiredUploads()],
    ];

    for (const [key, task] of tasks) {
      try {
        result[key] = await task();
      } catch (err: unknown) {
        result.errors++;
        functions.logger.error(`[cleanupOldData] Task "${key}" failed`, {
          error: err instanceof Error ? err.message : err,
        });
      }
    }

    log('Job complete', result);
  });
