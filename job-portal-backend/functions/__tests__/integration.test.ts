/**
 * Integration tests using Firebase Emulator Suite.
 * Start emulators before running:  firebase emulators:start --only firestore,auth,storage
 * Set env:  FIRESTORE_EMULATOR_HOST=localhost:8080
 */
import * as admin from 'firebase-admin';
import { makeDocumentSnapshot } from 'firebase-functions-test/lib/providers/firestore';
import { wrapV1, makeChange } from 'firebase-functions-test/lib/v1';

// ─── Emulator setup ───────────────────────────────────────────────────────────

process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST ?? 'localhost:8080';
process.env.FIREBASE_PROJECT_ID     = 'demo-test';
process.env.GCLOUD_PROJECT          = 'demo-test';
process.env.FIREBASE_CLIENT_EMAIL   = 'test@demo-test.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY    = '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----\n';
process.env.FIREBASE_STORAGE_BUCKET = 'demo-test.appspot.com';
process.env.CLAUDE_API_KEY          = 'test-claude-key';
process.env.STRIPE_SECRET           = 'sk_test_mock';
process.env.SENDGRID_KEY            = 'SG.mock';

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'demo-test' });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// Mock Claude so integration tests don't hit the real API.
// Response uses tool_use format to match the hardened computeFitScore (tool_choice enforced).
jest.mock('@anthropic-ai/sdk', () => jest.fn().mockImplementation(() => ({
  messages: {
    create: jest.fn().mockResolvedValue({
      content: [{
        type: 'tool_use',
        name: 'score_application',
        input: {
          fit_score: 78,
          matched_skills: ['TypeScript', 'React'],
          missing_skills: ['Kubernetes'],
          recommendation: 'Good match — hire for interview.',
        },
      }],
    }),
  },
})));

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function seed(collection: string, id: string, data: object) {
  await db.collection(collection).doc(id).set(data);
}

async function get(collection: string, id: string) {
  return (await db.collection(collection).doc(id).get()).data();
}

async function clearCollection(collection: string) {
  const snap = await db.collection(collection).get();
  await Promise.all(snap.docs.map((d) => d.ref.delete()));
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = admin.firestore.Timestamp.now();

const jobSeeker = { role: 'job_seeker', displayName: 'Alice Chen', email: 'alice@example.com', balance: 5, totalAdded: 5 };
const employer  = { role: 'employer',   displayName: 'Bob Corp',   email: 'hr@bobcorp.com' };
const resume    = { status: 'success', parsed: { skills: ['TypeScript', 'React'], experience: [], education: [] } };
const jd        = { status: 'success', parsed: { title: 'Frontend Dev', requirements: ['3y exp'], skills: ['TypeScript', 'React', 'Kubernetes'], experience_years: 3 } };

// ─── Test Suites ──────────────────────────────────────────────────────────────

beforeAll(async () => {
  await Promise.all([
    seed('users', 'seeker1', jobSeeker),
    seed('users', 'employer1', employer),
    seed('resumes', 'seeker1', resume),
    seed('jobs', 'job1', jd),
  ]);
});

afterAll(async () => {
  await Promise.all([
    clearCollection('users'), clearCollection('resumes'), clearCollection('jobs'),
    clearCollection('messages'), clearCollection('applications'),
  ]);
});

// ─── Flow 1: Message send → HR views → credit deducted ───────────────────────

describe('Flow: message send → view → credit deduction', () => {
  const MSG_ID  = 'msg-flow-1';
  const MSG_PATH = `messages/${MSG_ID}`;

  beforeAll(async () => {
    await seed('messages', MSG_ID, {
      fromUserId: 'seeker1', toUserId: 'employer1',
      body: 'Hi, interested in the role.',
      status: 'sent', creditDeducted: false,
      createdAt: NOW, expiresAt: NOW,
    });
  });

  test('message document exists with status sent', async () => {
    const msg = await get('messages', MSG_ID);
    expect(msg?.status).toBe('sent');
    expect(msg?.creditDeducted).toBe(false);
  });

  test('HR viewing message triggers credit deduction', async () => {
    const { deductCredit } = await import('../src/credits/deductCredit');
    const wrapped = wrapV1(deductCredit as any);

    const beforeSnap = makeDocumentSnapshot(
      { status: 'sent',  fromUserId: 'seeker1', creditDeducted: false },
      MSG_PATH
    );
    const afterSnap  = makeDocumentSnapshot(
      { status: 'seen',  fromUserId: 'seeker1', creditDeducted: false },
      MSG_PATH
    );
    const change = makeChange(beforeSnap, afterSnap);

    await wrapped(change, { params: { messageId: MSG_ID } } as any);

    const user = await get('users', 'seeker1');
    expect(user?.balance).toBe(4);

    const msg = await get('messages', MSG_ID);
    expect(msg?.creditDeducted).toBe(true);
  });

  test('viewing same message twice does not double-deduct', async () => {
    const { deductCredit } = await import('../src/credits/deductCredit');
    const wrapped = wrapV1(deductCredit as any);

    const beforeSnap = makeDocumentSnapshot(
      { status: 'sent', fromUserId: 'seeker1', creditDeducted: false },
      MSG_PATH
    );
    const afterSnap  = makeDocumentSnapshot(
      { status: 'seen', fromUserId: 'seeker1', creditDeducted: true },
      MSG_PATH
    );
    const change = makeChange(beforeSnap, afterSnap);

    await wrapped(change, { params: { messageId: MSG_ID } } as any);

    const user = await get('users', 'seeker1');
    expect(user?.balance).toBe(4); // unchanged
  });
});

// ─── Flow 2: Application created → fit score calculated ──────────────────────

describe('Flow: application created → fit score', () => {
  const APP_ID = 'app-flow-2';

  beforeAll(async () => {
    await seed('applications', APP_ID, { userId: 'seeker1', jobId: 'job1', appliedAt: NOW });
  });

  test('fit score is written to application document', async () => {
    const { fitScore } = await import('../src/ai/fitScore');
    const wrapped = wrapV1(fitScore as any);

    // Use a real emulator snapshot so snap.ref.update() targets the emulator correctly.
    const realSnap = await db.collection('applications').doc(APP_ID).get();

    await wrapped(realSnap, { params: { applicationId: APP_ID } } as any);

    const app = await get('applications', APP_ID);
    expect(app?.status).toBe('success');
    expect(app?.fit_score).toBe(78);
    expect(app?.matched_skills).toContain('TypeScript');
    expect(app?.missing_skills).toContain('Kubernetes');
  });
});

// ─── Flow 3: Payment received → credits added ─────────────────────────────────

describe('Flow: payment → credits added', () => {
  test('Stripe payment_intent.succeeded adds credits and logs transaction', async () => {
    const { addCredits } = await import('../src/credits/creditManager');
    await addCredits('seeker1', 10, 'stripe_purchase');

    const user = await get('users', 'seeker1');
    expect(user?.balance).toBe(14);      // 4 (after deduction) + 10
    expect(user?.totalAdded).toBe(15);   // 5 (initial) + 10

    const txSnap = await db.collection('users').doc('seeker1')
      .collection('credit_transactions').where('reason', '==', 'stripe_purchase').limit(1).get();
    expect(txSnap.empty).toBe(false);
    expect(txSnap.docs[0]!.data().amount).toBe(10);
    expect(txSnap.docs[0]!.data().type).toBe('topup');
  });

  test('adding zero credits is rejected', async () => {
    const { addCredits } = await import('../src/credits/creditManager');
    await expect(addCredits('seeker1', 0, 'bad')).rejects.toThrow();
  });
});
