import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import { COLLECTIONS, TIMEOUTS } from '../shared/constants';
import { sendPushNotification } from '../notifications/pushNotification';

type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'offer' | 'rejected';
const VALID_STATUSES: readonly string[] = ['applied', 'shortlisted', 'interview', 'offer', 'rejected'];

const log = (msg: string, data?: object) =>
  functions.logger.info(`[updateApplicationStatus] ${msg}`, data ?? {});

export const updateApplicationStatus = functions
  .runWith({ timeoutSeconds: TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
  .https.onCall(async (
    data: { applicationId: string; status: string },
    context
  ) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid           = context.auth.uid;
    const applicationId = String(data?.applicationId ?? '').trim();
    const status        = String(data?.status        ?? '').trim();

    if (!applicationId) {
      throw new functions.https.HttpsError('invalid-argument', 'applicationId is required.');
    }
    if (!VALID_STATUSES.includes(status)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `status must be one of: ${VALID_STATUSES.join(', ')}.`
      );
    }

    const db = getFirestore();

    const callerSnap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!callerSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const caller = callerSnap.data() as Record<string, unknown>;
    if (caller['role'] !== 'employer') {
      throw new functions.https.HttpsError('permission-denied', 'Only employers can update application status.');
    }

    const appSnap = await db.collection(COLLECTIONS.APPLICATIONS).doc(applicationId).get();
    if (!appSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Application not found.');
    }
    const appData = appSnap.data() as Record<string, unknown>;
    if (appData['employerId'] !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'You are not the employer for this application.');
    }

    await appSnap.ref.update({
      status: status as ApplicationStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    log('Status updated', { applicationId, status });

    const applicantId = String(appData['applicantId'] ?? appData['userId'] ?? '');
    const jobTitle    = String(appData['jobTitle']    ?? 'the position');
    if (applicantId) {
      const pushTitle = status === 'offer' ? 'Congratulations! Job Offer' : 'Application Update';
      const pushBody  = `Your application for "${jobTitle}" has been updated to: ${status}`;
      sendPushNotification(applicantId, 'job_matched', pushTitle, pushBody, { applicationId, status }).catch(
        (err: unknown) => {
          functions.logger.warn('[updateApplicationStatus] Push notification failed', {
            applicantId,
            error: err instanceof Error ? err.message : err,
          });
        }
      );
    }

    return { success: true, applicationId, status };
  });
