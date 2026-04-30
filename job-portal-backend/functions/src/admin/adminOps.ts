import * as functions from 'firebase-functions';
import { getFirestore } from '../shared/firebaseAdmin';
import { COLLECTIONS, PAGINATION } from '../shared/constants';

const PAGE_SIZE_DEFAULT = PAGINATION.DEFAULT_LIMIT;
const PAGE_SIZE_MAX     = PAGINATION.MAX_LIMIT;

function formatTimestamp(value: unknown): string {
  const raw = value as { toDate?: () => Date } | undefined;
  if (raw?.toDate) {
    return raw.toDate().toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
  return '—';
}

async function assertAdmin(context: functions.https.CallableContext): Promise<void> {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }
  const callerSnap = await getFirestore().collection(COLLECTIONS.USERS).doc(uid).get();
  if (callerSnap.data()?.['role'] !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }
}

function parsePagination(data: unknown): { pageSize: number; startAfter: string | undefined } {
  const raw = (data ?? {}) as Record<string, unknown>;
  const pageSize = Math.min(
    Math.max(1, typeof raw['pageSize'] === 'number' ? Math.floor(raw['pageSize']) : PAGE_SIZE_DEFAULT),
    PAGE_SIZE_MAX
  );
  const startAfter =
    typeof raw['startAfter'] === 'string' ? raw['startAfter'].trim() || undefined : undefined;
  return { pageSize, startAfter };
}

async function applyCollectionCursor<T extends FirebaseFirestore.DocumentData>(
  col: FirebaseFirestore.CollectionReference<T>,
  q: FirebaseFirestore.Query<T>,
  startAfter?: string
): Promise<{ query: FirebaseFirestore.Query<T>; cursorValid: boolean }> {
  if (!startAfter) {
    return { query: q, cursorValid: true };
  }

  const cursorSnap = await col.doc(startAfter).get();
  if (!cursorSnap.exists) {
    return { query: q, cursorValid: false };
  }

  return { query: q.startAfter(cursorSnap), cursorValid: true };
}

async function resolveCollectionGroupCursor(
  db: FirebaseFirestore.Firestore,
  collectionId: string,
  startAfter?: string
): Promise<{
  cursorSnap: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData> | null;
  cursorValid: boolean;
}> {
  if (!startAfter) {
    return { cursorSnap: null, cursorValid: true };
  }

  const cursorSnaps = await db
    .collectionGroup(collectionId)
    .where('__name__', '==', startAfter)
    .limit(1)
    .get();

  if (cursorSnaps.empty) {
    return { cursorSnap: null, cursorValid: false };
  }

  return { cursorSnap: cursorSnaps.docs[0], cursorValid: true };
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export const getAdminStats = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (_data, context) => {
    await assertAdmin(context);

    const db = getFirestore();
    const [users, jobs, applications, messages] = await Promise.all([
      db.collection(COLLECTIONS.USERS).count().get(),
      db.collection(COLLECTIONS.JOBS).count().get(),
      db.collection(COLLECTIONS.APPLICATIONS).count().get(),
      db.collection(COLLECTIONS.MESSAGES).count().get(),
    ]);

    return {
      totalUsers:        users.data().count,
      totalJobs:         jobs.data().count,
      totalApplications: applications.data().count,
      totalMessages:     messages.data().count,
    };
  });

// ─── Users ────────────────────────────────────────────────────────────────────

export const listAdminUsers = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data, context) => {
    await assertAdmin(context);

    const { pageSize, startAfter } = parsePagination(data);
    const db  = getFirestore();
    const col = db.collection(COLLECTIONS.USERS);

    let q: FirebaseFirestore.Query = col.orderBy('createdAt', 'desc').limit(pageSize + 1);
    let cursorValid = true;
    if (startAfter) {
      const cursorResult = await applyCollectionCursor(col, q, startAfter);
      q = cursorResult.query;
      cursorValid = cursorResult.cursorValid;
    }

    const snap    = await q.get();
    const hasMore = snap.docs.length > pageSize;
    const docs    = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

    return {
      items: docs.map((userDoc) => {
        const d = userDoc.data() as Record<string, unknown>;
        return {
          uid:       userDoc.id,
          email:     String(d['email'] ?? ''),
          name:      String(d['displayName'] ?? d['name'] ?? ''),
          role:      String(d['role'] ?? 'job_seeker'),
          location:  String(d['location'] ?? ''),
          balance:   typeof d['balance'] === 'number' ? d['balance'] : 0,
          createdAt: formatTimestamp(d['createdAt']),
        };
      }),
      nextPageToken: hasMore ? docs[docs.length - 1].id : undefined,
      cursorValid,
    };
  });

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const listAdminJobs = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data, context) => {
    await assertAdmin(context);

    const { pageSize, startAfter } = parsePagination(data);
    const db  = getFirestore();
    const col = db.collection(COLLECTIONS.JOBS);

    let q: FirebaseFirestore.Query = col.orderBy('createdAt', 'desc').limit(pageSize + 1);
    let cursorValid = true;
    if (startAfter) {
      const cursorResult = await applyCollectionCursor(col, q, startAfter);
      q = cursorResult.query;
      cursorValid = cursorResult.cursorValid;
    }

    const snap    = await q.get();
    const hasMore = snap.docs.length > pageSize;
    const docs    = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

    return {
      items: docs.map((jobDoc) => {
        const d = jobDoc.data() as Record<string, unknown>;
        return {
          id:         jobDoc.id,
          title:      String(d['title'] ?? 'Untitled'),
          company:    String(d['company'] ?? ''),
          location:   String(d['location'] ?? ''),
          employerId: String(d['employerId'] ?? ''),
          status:     String(d['status'] ?? 'open'),
          createdAt:  formatTimestamp(d['createdAt']),
        };
      }),
      nextPageToken: hasMore ? docs[docs.length - 1].id : undefined,
      cursorValid,
    };
  });

export const deleteAdminJob = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { jobId: string }, context) => {
    await assertAdmin(context);

    const jobId = String(data?.jobId ?? '').trim();
    if (!jobId) {
      throw new functions.https.HttpsError('invalid-argument', 'jobId is required.');
    }
    await getFirestore().collection(COLLECTIONS.JOBS).doc(jobId).delete();
    return { success: true };
  });

// ─── Applications ─────────────────────────────────────────────────────────────

export const listAdminApplications = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data, context) => {
    await assertAdmin(context);

    const { pageSize, startAfter } = parsePagination(data);
    const db  = getFirestore();
    const col = db.collection(COLLECTIONS.APPLICATIONS);

    let q: FirebaseFirestore.Query = col.orderBy('appliedAt', 'desc').limit(pageSize + 1);
    let cursorValid = true;
    if (startAfter) {
      const cursorResult = await applyCollectionCursor(col, q, startAfter);
      q = cursorResult.query;
      cursorValid = cursorResult.cursorValid;
    }

    const snap    = await q.get();
    const hasMore = snap.docs.length > pageSize;
    const docs    = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

    return {
      items: docs.map((applicationDoc) => {
        const d = applicationDoc.data() as Record<string, unknown>;
        return {
          id:             applicationDoc.id,
          jobTitle:       String(d['jobTitle'] ?? 'Unknown role'),
          company:        String(d['company'] ?? ''),
          applicantName:  String(d['applicantName'] ?? ''),
          applicantEmail: String(d['applicantEmail'] ?? ''),
          employerId:     String(d['employerId'] ?? ''),
          status:         String(d['status'] ?? 'applied'),
          fitScore:       typeof d['fit_score'] === 'number' ? d['fit_score'] : null,
          appliedAt:      formatTimestamp(d['appliedAt'] ?? d['createdAt']),
        };
      }),
      nextPageToken: hasMore ? docs[docs.length - 1].id : undefined,
      cursorValid,
    };
  });

export const deleteAdminApplication = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { applicationId: string }, context) => {
    await assertAdmin(context);

    const applicationId = String(data?.applicationId ?? '').trim();
    if (!applicationId) {
      throw new functions.https.HttpsError('invalid-argument', 'applicationId is required.');
    }
    await getFirestore().collection(COLLECTIONS.APPLICATIONS).doc(applicationId).delete();
    return { success: true };
  });

// ─── Messages ─────────────────────────────────────────────────────────────────

export const listAdminMessages = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data, context) => {
    await assertAdmin(context);

    const { pageSize, startAfter } = parsePagination(data);
    const db  = getFirestore();
    const col = db.collection(COLLECTIONS.MESSAGES);

    let q: FirebaseFirestore.Query = col.orderBy('createdAt', 'desc').limit(pageSize + 1);
    let cursorValid = true;
    if (startAfter) {
      const cursorResult = await applyCollectionCursor(col, q, startAfter);
      q = cursorResult.query;
      cursorValid = cursorResult.cursorValid;
    }

    const snap    = await q.get();
    const hasMore = snap.docs.length > pageSize;
    const docs    = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

    return {
      items: docs.map((messageDoc) => {
        const d = messageDoc.data() as Record<string, unknown>;
        return {
          id:         messageDoc.id,
          fromName:   String(d['fromName'] ?? ''),
          toName:     String(d['toName'] ?? ''),
          subject:    String(d['subject'] ?? d['jobTitle'] ?? ''),
          body:       String(d['body'] ?? d['text'] ?? ''),
          status:     String(d['status'] ?? 'sent'),
          creditCost: typeof d['creditCost'] === 'number' ? d['creditCost'] : 1,
          createdAt:  formatTimestamp(d['createdAt']),
        };
      }),
      nextPageToken: hasMore ? docs[docs.length - 1].id : undefined,
      cursorValid,
    };
  });

export const deleteAdminMessage = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { messageId: string }, context) => {
    await assertAdmin(context);

    const messageId = String(data?.messageId ?? '').trim();
    if (!messageId) {
      throw new functions.https.HttpsError('invalid-argument', 'messageId is required.');
    }
    await getFirestore().collection(COLLECTIONS.MESSAGES).doc(messageId).delete();
    return { success: true };
  });

// ─── Credit Transactions ──────────────────────────────────────────────────────

export const listAdminCreditTransactions = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data, context) => {
    await assertAdmin(context);

    const { pageSize, startAfter } = parsePagination(data);
    const db = getFirestore();

    let q: FirebaseFirestore.Query = db
      .collectionGroup('credit_transactions')
      .orderBy('date', 'desc')
      .limit(pageSize + 1);

    let cursorValid = true;
    if (startAfter) {
      const resolved = await resolveCollectionGroupCursor(db, 'credit_transactions', startAfter);
      cursorValid = resolved.cursorValid;
      if (resolved.cursorSnap) q = q.startAfter(resolved.cursorSnap);
    }

    const snap    = await q.get();
    const hasMore = snap.docs.length > pageSize;
    const docs    = hasMore ? snap.docs.slice(0, pageSize) : snap.docs;

    return {
      items: docs.map((creditDoc) => {
        const d = creditDoc.data() as Record<string, unknown>;
        return {
          id:           creditDoc.id,
          userId:       creditDoc.ref.parent.parent?.id ?? '',
          type:         String(d['type'] ?? ''),
          reason:       String(d['reason'] ?? ''),
          amount:       typeof d['amount'] === 'number' ? d['amount'] : 0,
          balanceAfter: typeof d['balanceAfter'] === 'number' ? d['balanceAfter'] : 0,
          date:         formatTimestamp(d['date']),
        };
      }),
      nextPageToken: hasMore ? docs[docs.length - 1].ref.path : undefined,
      cursorValid,
    };
  });
