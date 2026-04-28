import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import { getFirestore } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import type { FitScoreDocument, MissingSkillsDetail, MissingSkillsInput, SkillGap } from './types';

const claude = new Anthropic({ apiKey: config.CLAUDE_API_KEY });
const log = (msg: string, data?: object) =>
  functions.logger.info(`[missingSkills] ${msg}`, data ?? {});

// ─── Premium guard ────────────────────────────────────────────────────────────

async function assertPremium(uid: string): Promise<void> {
  const userRecord = await admin.auth().getUser(uid);
  if (userRecord.customClaims?.['premium'] !== true) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'This feature requires a premium subscription.'
    );
  }
}

// ─── Claude analysis ──────────────────────────────────────────────────────────

async function analyzeWithClaude(missingSkills: string[], jobTitle: string | null): Promise<SkillGap[]> {
  if (missingSkills.length === 0) return [];

  const message = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content:
          `Analyze these missing skills for a "${jobTitle ?? 'this role'}" position.\n` +
          'Return ONLY valid JSON — an array, no markdown:\n' +
          '[{ "skill": string, "learn_time_months": number, "resources": string[], "job_impact": string }]\n\n' +
          `Missing skills: ${JSON.stringify(missingSkills)}`,
      },
    ],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  return JSON.parse(raw) as SkillGap[];
}

// ─── Callable Function ────────────────────────────────────────────────────────

export const missingSkills = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onCall(async (data: MissingSkillsInput, context) => {
    if (!context.auth?.uid) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }

    const { jobId, applicationId } = data ?? {};
    if (!jobId || !applicationId) {
      throw new functions.https.HttpsError('invalid-argument', 'Both jobId and applicationId are required.');
    }

    const uid = context.auth.uid;
    log('Request received', { uid, applicationId, jobId });

    await assertPremium(uid);

    const db = getFirestore();

    const [appSnap, jdSnap] = await Promise.all([
      db.collection('applications').doc(applicationId).get(),
      db.collection('jobs').doc(jobId).get(),
    ]);

    if (!appSnap.exists) {
      throw new functions.https.HttpsError('not-found', `Application ${applicationId} not found.`);
    }

    const appData = appSnap.data() as Partial<FitScoreDocument>;

    if (appData.status !== 'success' || !appData.missing_skills?.length) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Fit score must be successfully computed before analyzing missing skills.'
      );
    }

    // Ensure caller owns the application
    const appOwner = (appSnap.data() as Record<string, unknown>)?.['userId'];
    if (appOwner !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Access denied.');
    }

    const jobTitle = jdSnap.exists ? (jdSnap.data()?.['parsed']?.title as string | null) : null;

    log('Calling Claude', { applicationId, missingCount: appData.missing_skills.length });

    let skill_gaps: SkillGap[];
    try {
      skill_gaps = await analyzeWithClaude(appData.missing_skills, jobTitle);
    } catch (err: unknown) {
      functions.logger.error('[missingSkills] Claude failed', { error: err instanceof Error ? err.message : err });
      throw new functions.https.HttpsError('internal', 'Skill analysis failed. Please try again.');
    }

    const detail: MissingSkillsDetail = {
      applicationId,
      jobId,
      skill_gaps,
      generatedAt: admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    };

    await db
      .collection('applications')
      .doc(applicationId)
      .collection('missing_skills_detail')
      .doc('latest')
      .set(detail);

    log('Analysis stored', { applicationId, gaps: skill_gaps.length });
    return { skill_gaps };
  });
