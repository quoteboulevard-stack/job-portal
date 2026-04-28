import * as functions from 'firebase-functions';
import { getFirestore } from '../shared/firebaseAdmin';

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

  const callerSnap = await getFirestore().collection('users').doc(uid).get();
  if (callerSnap.data()?.['role'] !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
  }
}

export const getAdminStats = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (_data, context) => {
    await assertAdmin(context);

    const db = getFirestore();
    const [users, jobs, applications, messages] = await Promise.all([
      db.collection('users').get(),
      db.collection('jobs').get(),
      db.collection('applications').get(),
      db.collection('messages').get(),
    ]);

    return {
      totalUsers: users.size,
      totalJobs: jobs.size,
      totalApplications: applications.size,
      totalMessages: messages.size,
    };
  });

export const listAdminUsers = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (_data, context) => {
    await assertAdmin(context);

    const snap = await getFirestore().collection('users').get();
    return snap.docs.map((userDoc) => {
      const d = userDoc.data() as Record<string, unknown>;
      return {
        uid: userDoc.id,
        email: String(d['email'] ?? ''),
        name: String(d['displayName'] ?? d['name'] ?? ''),
        role: String(d['role'] ?? 'job_seeker'),
        location: String(d['location'] ?? ''),
        balance: typeof d['balance'] === 'number' ? d['balance'] : 0,
        createdAt: formatTimestamp(d['createdAt']),
      };
    });
  });

export const listAdminJobs = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (_data, context) => {
    await assertAdmin(context);

    const snap = await getFirestore().collection('jobs').get();
    return snap.docs.map((jobDoc) => {
      const d = jobDoc.data() as Record<string, unknown>;
      return {
        id: jobDoc.id,
        title: String(d['title'] ?? 'Untitled'),
        company: String(d['company'] ?? ''),
        location: String(d['location'] ?? ''),
        employerId: String(d['employerId'] ?? ''),
        status: String(d['status'] ?? 'open'),
        createdAt: formatTimestamp(d['createdAt']),
      };
    });
  });

export const deleteAdminJob = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { jobId: string }, context) => {
    await assertAdmin(context);

    const jobId = String(data?.jobId ?? '').trim();
    if (!jobId) {
      throw new functions.https.HttpsError('invalid-argument', 'jobId is required.');
    }
    await getFirestore().collection('jobs').doc(jobId).delete();
    return { success: true };
  });

export const listAdminApplications = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (_data, context) => {
    await assertAdmin(context);

    const snap = await getFirestore().collection('applications').get();
    return snap.docs.map((applicationDoc) => {
      const d = applicationDoc.data() as Record<string, unknown>;
      return {
        id: applicationDoc.id,
        jobTitle: String(d['jobTitle'] ?? 'Unknown role'),
        company: String(d['company'] ?? ''),
        applicantName: String(d['applicantName'] ?? ''),
        applicantEmail: String(d['applicantEmail'] ?? ''),
        employerId: String(d['employerId'] ?? ''),
        status: String(d['status'] ?? 'applied'),
        fitScore: typeof d['fitScore'] === 'number' ? d['fitScore'] : null,
        appliedAt: formatTimestamp(d['appliedAt'] ?? d['createdAt']),
      };
    });
  });

export const deleteAdminApplication = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { applicationId: string }, context) => {
    await assertAdmin(context);

    const applicationId = String(data?.applicationId ?? '').trim();
    if (!applicationId) {
      throw new functions.https.HttpsError('invalid-argument', 'applicationId is required.');
    }
    await getFirestore().collection('applications').doc(applicationId).delete();
    return { success: true };
  });

export const listAdminMessages = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (_data, context) => {
    await assertAdmin(context);

    const snap = await getFirestore().collection('messages').get();
    return snap.docs.map((messageDoc) => {
      const d = messageDoc.data() as Record<string, unknown>;
      return {
        id: messageDoc.id,
        fromName: String(d['fromName'] ?? ''),
        toName: String(d['toName'] ?? ''),
        subject: String(d['subject'] ?? d['jobTitle'] ?? ''),
        body: String(d['body'] ?? d['text'] ?? ''),
        status: String(d['status'] ?? 'sent'),
        creditCost: typeof d['creditCost'] === 'number' ? d['creditCost'] : 1,
        createdAt: formatTimestamp(d['createdAt']),
      };
    });
  });

export const deleteAdminMessage = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: { messageId: string }, context) => {
    await assertAdmin(context);

    const messageId = String(data?.messageId ?? '').trim();
    if (!messageId) {
      throw new functions.https.HttpsError('invalid-argument', 'messageId is required.');
    }
    await getFirestore().collection('messages').doc(messageId).delete();
    return { success: true };
  });

export const listAdminCreditTransactions = functions
  .runWith({ timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (_data, context) => {
    await assertAdmin(context);

    const snap = await getFirestore()
      .collectionGroup('credit_transactions')
      .orderBy('date', 'desc')
      .get();

    return snap.docs.map((creditDoc) => {
      const d = creditDoc.data() as Record<string, unknown>;
      return {
        id: creditDoc.id,
        userId: creditDoc.ref.parent.parent?.id ?? '',
        type: String(d['type'] ?? ''),
        reason: String(d['reason'] ?? ''),
        amount: typeof d['amount'] === 'number' ? d['amount'] : 0,
        balanceAfter: typeof d['balanceAfter'] === 'number' ? d['balanceAfter'] : 0,
        date: formatTimestamp(d['date']),
      };
    });
  });
