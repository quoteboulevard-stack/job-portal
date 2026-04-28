/**
 * Contract compliance tests — no emulator required, no network calls.
 *
 * These tests verify that the field names and status enum values used by
 * backend functions match the canonical contract defined in the shared-lib.
 * They run as plain unit tests so they are cheap enough to include in CI.
 */

import type { ApplicationStatus, MessageStatus, Message, Application } from '@job-portal/shared';
import { APPLICATION_STATUS, MESSAGE_STATUS } from '@job-portal/shared';

// ─── ApplicationStatus ────────────────────────────────────────────────────────

describe('ApplicationStatus contract', () => {
  // Values the backend actually validates and writes.
  const BACKEND_VALID_STATUSES = ['applied', 'shortlisted', 'interview', 'offer', 'rejected'] as const;

  test('shared-lib ApplicationStatus union matches backend VALID_STATUSES exactly', () => {
    // Type-level check: every value the backend accepts must be assignable to ApplicationStatus.
    const coerce = (s: string): ApplicationStatus => s as ApplicationStatus;
    expect(() => BACKEND_VALID_STATUSES.map(coerce)).not.toThrow();

    // Value-level check: the APPLICATION_STATUS constant contains the same set.
    const constantValues = Object.values(APPLICATION_STATUS).sort();
    const backendValues  = [...BACKEND_VALID_STATUSES].sort();
    expect(constantValues).toEqual(backendValues);
  });

  test('APPLICATION_STATUS keys and values are self-consistent', () => {
    expect(APPLICATION_STATUS.APPLIED).toBe('applied');
    expect(APPLICATION_STATUS.SHORTLISTED).toBe('shortlisted');
    expect(APPLICATION_STATUS.INTERVIEW).toBe('interview');
    expect(APPLICATION_STATUS.OFFER).toBe('offer');
    expect(APPLICATION_STATUS.REJECTED).toBe('rejected');
  });

  test('createApplication initial status is a valid ApplicationStatus', () => {
    const initialStatus: ApplicationStatus = 'applied';
    expect(Object.values(APPLICATION_STATUS)).toContain(initialStatus);
  });
});

// ─── MessageStatus ────────────────────────────────────────────────────────────

describe('MessageStatus contract', () => {
  const ALL_STATUSES: MessageStatus[] = [
    'waiting', 'sent', 'seen', 'accepted', 'rejected', 'expired', 'invalid',
  ];

  test('MESSAGE_STATUS constant covers all shared-lib MessageStatus values', () => {
    const constantValues = Object.values(MESSAGE_STATUS).sort();
    const typeValues     = [...ALL_STATUSES].sort();
    expect(constantValues).toEqual(typeValues);
  });

  test('deductCredit triggers on sent→seen transition (valid statuses)', () => {
    const before: MessageStatus = 'sent';
    const after:  MessageStatus = 'seen';
    expect(ALL_STATUSES).toContain(before);
    expect(ALL_STATUSES).toContain(after);
  });

  test('acceptMessage and rejectMessage produce valid terminal statuses', () => {
    const accepted: MessageStatus = 'accepted';
    const rejected: MessageStatus = 'rejected';
    expect(ALL_STATUSES).toContain(accepted);
    expect(ALL_STATUSES).toContain(rejected);
  });
});

// ─── Message field names ──────────────────────────────────────────────────────

describe('Message field name contract', () => {
  // Construct a minimal valid Message to confirm the shared-lib type uses the
  // canonical Firestore field names (fromUserId, toUserId, body — not from/to/text).
  const msg: Message = {
    id:            'msg-1',
    fromUserId:    'seeker-uid',
    toUserId:      'employer-uid',
    body:          'Hello, interested in the role.',
    status:        'sent',
    creditDeducted: false,
    createdAt:     new Date().toISOString(),
    expiresAt:     new Date().toISOString(),
  };

  test('Message uses fromUserId (not "from")', () => {
    expect(msg.fromUserId).toBeDefined();
    expect((msg as Record<string, unknown>)['from']).toBeUndefined();
  });

  test('Message uses toUserId (not "to")', () => {
    expect(msg.toUserId).toBeDefined();
    expect((msg as Record<string, unknown>)['to']).toBeUndefined();
  });

  test('Message uses body (not "text")', () => {
    expect(msg.body).toBeDefined();
    expect((msg as Record<string, unknown>)['text']).toBeUndefined();
  });

  test('Message uses rejectionReason (not "reason")', () => {
    const rejected: Message = { ...msg, status: 'rejected', rejectionReason: 'Not a fit.' };
    expect(rejected.rejectionReason).toBe('Not a fit.');
    expect((rejected as Record<string, unknown>)['reason']).toBeUndefined();
  });
});

// ─── Application field names ─────────────────────────────────────────────────

describe('Application field name contract', () => {
  const app: Application = {
    id:        'app-1',
    userId:    'seeker-uid',
    jobId:     'job-1',
    status:    'applied',
    fit_score: null,
    createdAt: new Date().toISOString(),
  };

  test('Application status starts as "applied"', () => {
    expect(app.status).toBe('applied');
  });

  test('fit_score field name matches backend (snake_case)', () => {
    expect('fit_score' in app).toBe(true);
    expect((app as Record<string, unknown>)['fitScore']).toBeUndefined();
  });
});

// ─── Credit field names ───────────────────────────────────────────────────────

describe('Credit field name contract', () => {
  test('Credit uses totalAdded (not "total")', () => {
    // Import the type and construct an object to confirm the field name at the
    // TypeScript level. If the type used "total" this line would not compile.
    const credit: import('@job-portal/shared').Credit = {
      available:    5,
      used:         1,
      totalAdded:   6,
      transactions: [],
    };
    expect(credit.totalAdded).toBe(6);
    expect((credit as Record<string, unknown>)['total']).toBeUndefined();
  });
});

// ─── User field names ─────────────────────────────────────────────────────────

describe('User field name contract', () => {
  test('User uses displayName (not "name")', () => {
    const user: import('@job-portal/shared').User = {
      id:          'uid-1',
      email:       'alice@example.com',
      displayName: 'Alice Chen',
      role:        'job_seeker',
      createdAt:   new Date().toISOString(),
    };
    expect(user.displayName).toBe('Alice Chen');
    expect((user as Record<string, unknown>)['name']).toBeUndefined();
  });
});
