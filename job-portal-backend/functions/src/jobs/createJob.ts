import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import { COLLECTIONS, TIMEOUTS } from '../shared/constants';

type WorkMode       = 'remote' | 'hybrid' | 'onsite';
type EmploymentType = 'fulltime' | 'parttime' | 'contract' | 'internship' | 'freelance';
type Experience     = 'entry' | 'mid' | 'senior';

const VALID_WORK_MODES:       readonly string[] = ['remote', 'hybrid', 'onsite'];
const VALID_EMPLOYMENT_TYPES: readonly string[] = ['fulltime', 'parttime', 'contract', 'internship', 'freelance'];
const VALID_EXPERIENCES:      readonly string[] = ['entry', 'mid', 'senior'];
const MAX_DESCRIPTION = 10_000;
const MAX_LIST_ITEMS  = 50;
const MAX_ITEM_LENGTH = 200;

const log = (msg: string, data?: object) =>
  functions.logger.info(`[createJob] ${msg}`, data ?? {});

function requireString(value: unknown, field: string, max = 500): string {
  const s = String(value ?? '').trim();
  if (!s) throw new functions.https.HttpsError('invalid-argument', `${field} is required.`);
  if (s.length > max) throw new functions.https.HttpsError('invalid-argument', `${field} must be <= ${max} characters.`);
  return s;
}

function sanitiseList(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) return [];
  if (value.length > MAX_LIST_ITEMS) {
    throw new functions.https.HttpsError('invalid-argument', `${field} must have <= ${MAX_LIST_ITEMS} items.`);
  }
  return value
    .map((item: unknown) => String(item ?? '').trim())
    .filter(Boolean)
    .map((item) => {
      if (item.length > MAX_ITEM_LENGTH) {
        throw new functions.https.HttpsError('invalid-argument', `Each item in ${field} must be <= ${MAX_ITEM_LENGTH} characters.`);
      }
      return item;
    });
}

export const createJob = functions
  .runWith({ timeoutSeconds: TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
  .https.onCall(async (data: {
    title: string;
    company: string;
    location: string;
    workMode: string;
    employmentType: string;
    experience: string;
    description: string;
    salary?: number | null;
    requirements?: unknown[];
    skills?: unknown[];
    perks?: unknown[];
  }, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const uid = context.auth.uid;
    const db  = getFirestore();

    const callerSnap = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!callerSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const caller = callerSnap.data() as Record<string, unknown>;
    if (caller['role'] !== 'employer') {
      throw new functions.https.HttpsError('permission-denied', 'Only employers can post jobs.');
    }

    const title       = requireString(data?.title,       'title');
    const company     = requireString(data?.company,     'company');
    const location    = requireString(data?.location,    'location');
    const description = requireString(data?.description, 'description', MAX_DESCRIPTION);

    const workMode = String(data?.workMode ?? '').trim() as WorkMode;
    if (!VALID_WORK_MODES.includes(workMode)) {
      throw new functions.https.HttpsError('invalid-argument', `workMode must be one of: ${VALID_WORK_MODES.join(', ')}.`);
    }

    const employmentType = String(data?.employmentType ?? '').trim() as EmploymentType;
    if (!VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
      throw new functions.https.HttpsError('invalid-argument', `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}.`);
    }

    const experience = String(data?.experience ?? 'entry').trim() as Experience;
    if (!VALID_EXPERIENCES.includes(experience)) {
      throw new functions.https.HttpsError('invalid-argument', `experience must be one of: ${VALID_EXPERIENCES.join(', ')}.`);
    }

    const salary = typeof data?.salary === 'number' && Number.isFinite(data.salary) && data.salary > 0
      ? Math.round(data.salary)
      : null;

    const requirements = sanitiseList(data?.requirements, 'requirements');
    const skills       = sanitiseList(data?.skills,       'skills');
    const perks        = sanitiseList(data?.perks,        'perks');

    const serverTs = admin.firestore.FieldValue.serverTimestamp();

    const jobRef = await db.collection(COLLECTIONS.JOBS).add({
      title,
      company,
      location,
      workMode,
      employmentType,
      experience,
      description,
      salary,
      requirements,
      skills,
      perks,
      employerId: uid,
      status: 'open',
      postedAt:  serverTs,
      createdAt: serverTs,
      updatedAt: serverTs,
    });

    log('Job created', { jobId: jobRef.id, uid });
    return { success: true, jobId: jobRef.id };
  });
