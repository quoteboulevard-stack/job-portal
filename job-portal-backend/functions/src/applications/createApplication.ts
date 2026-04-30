import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import { COLLECTIONS, TIMEOUTS } from '../shared/constants';
import { sendPushNotification } from '../notifications/pushNotification';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[createApplication] ${msg}`, data ?? {});

export const createApplication = functions
  .runWith({ timeoutSeconds: TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
  .https.onCall(async (
    data: { jobId: string },
    context
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid   = context.auth.uid;
    const jobId = String(data?.jobId ?? '').trim();

    if (!jobId) throw new functions.https.HttpsError('invalid-argument', 'jobId is required.');

    const db = getFirestore();

    const callerSnap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!callerSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const caller = callerSnap.data() as Record<string, unknown>;
    if (caller['role'] !== 'job_seeker') {
      throw new functions.https.HttpsError('permission-denied', 'Only job seekers can apply to jobs.');
    }

    const applicationId = `${uid}_${jobId}`;
    const existingSnap = await db.collection(COLLECTIONS.APPLICATIONS).doc(applicationId).get();
    if (existingSnap.exists) {
      throw new functions.https.HttpsError('already-exists', 'You have already applied to this job.');
    }

    const jobSnap = await db.collection(COLLECTIONS.JOBS).doc(jobId).get();
    if (!jobSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Job not found.');
    }
    const job        = jobSnap.data() as Record<string, unknown>;
    const jobTitle   = String(job['title']      ?? '');
    const company    = String(job['company']    ?? '');
    const employerId = String(job['employerId'] ?? '');

    if (!employerId) {
      throw new functions.https.HttpsError('internal', 'Job is missing employerId.');
    }
    if (uid === employerId) {
      throw new functions.https.HttpsError('invalid-argument', 'Employers cannot apply to their own jobs.');
    }

    const applicantName  = String(caller['displayName'] ?? context.auth.token.name  ?? '');
    const applicantEmail = String(caller['email']        ?? context.auth.token.email ?? '');
    const serverTs = admin.firestore.FieldValue.serverTimestamp();

    await db.collection(COLLECTIONS.APPLICATIONS).doc(applicationId).set({
      jobId,
      jobTitle,
      company,
      employerId,
      applicantId: uid,
      applicantName,
      applicantEmail,
      status: 'applied',
      appliedAt: serverTs,
      updatedAt: serverTs,
    });

    log('Application created', { applicationId, jobId, uid });

    // Fire-and-forget push — the Firestore onCreate trigger will compute fit score
    sendPushNotification(
      employerId,
      'job_matched',
      'New application received',
      `${applicantName || 'A job seeker'} applied for "${jobTitle}"`,
      { applicationId, jobId }
    ).catch((err: unknown) => {
      functions.logger.warn('[createApplication] Push notification failed', {
        employerId,
        error: err instanceof Error ? err.message : err,
      });
    });

    return { success: true, applicationId };
  });
