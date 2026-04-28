# Job Portal Testing Guide

## Purpose

This document defines the production testing strategy for the Job Portal platform across the web client, mobile clients, shared library, and Firebase backend. The goal is to ensure that critical hiring, messaging, AI enrichment, and payment workflows remain correct as the system evolves.

The testing approach is split into:

- unit tests for isolated business logic
- integration tests for boundary behavior across Firebase services and external integrations
- automated CI/CD enforcement for quality gates before deployment

## Test Pyramid

The recommended default is:

- many fast unit tests around validators, state transitions, mappers, and pricing or credit logic
- fewer integration tests covering Firebase Auth, Firestore, Storage, callable functions, triggers, and webhook flows
- a small number of end-to-end smoke checks for the highest-risk production paths

Priority should always favor the workflows with financial, authorization, or lifecycle risk:

- accepting and rejecting messages
- credit deduction and refund
- payment webhook fulfillment and idempotency
- resume and JD parsing persistence
- application fit scoring updates
- Firestore authorization boundaries

## Unit Test Examples

Unit tests should run without network access and without real Firebase or payment-provider dependencies. Mock all external collaborators and focus on deterministic business behavior.

Recommended unit-test targets:

- shared validation helpers in `job-portal-shared-lib`
- role and state-transition guards in backend services
- callable-function input validation
- payment metadata parsing and idempotency helpers
- response mappers and error translation logic in web and mobile clients

### Example: message validation

```ts
import { describe, expect, it } from 'vitest';
import { validateMessagePayload } from '../src/messages/validateMessagePayload';

describe('validateMessagePayload', () => {
  it('accepts a valid seeker-to-employer message', () => {
    const result = validateMessagePayload({
      fromRole: 'job_seeker',
      toRole: 'employer',
      body: 'Hello, I would like to discuss this role.',
    });

    expect(result.valid).toBe(true);
  });

  it('rejects messages longer than 2000 characters', () => {
    const result = validateMessagePayload({
      fromRole: 'job_seeker',
      toRole: 'employer',
      body: 'x'.repeat(2001),
    });

    expect(result.valid).toBe(false);
    expect(result.code).toBe('invalid-argument');
  });
});
```

### Example: credit mutation helper

```ts
import { describe, expect, it } from 'vitest';
import { applyCreditTransaction } from '../src/credits/applyCreditTransaction';

describe('applyCreditTransaction', () => {
  it('deducts credits and updates balance', () => {
    const next = applyCreditTransaction(
      { available: 10, used: 5, total: 15 },
      { type: 'deduction', amount: 1, reason: 'message_seen' }
    );

    expect(next.available).toBe(9);
    expect(next.used).toBe(6);
  });

  it('throws when balance is insufficient', () => {
    expect(() =>
      applyCreditTransaction(
        { available: 0, used: 5, total: 5 },
        { type: 'deduction', amount: 1, reason: 'message_seen' }
      )
    ).toThrow(/insufficient/i);
  });
});
```

### Example: webhook signature verification

```ts
import { describe, expect, it } from 'vitest';
import { verifyStripeSignature } from '../src/payments/verifyStripeSignature';

describe('verifyStripeSignature', () => {
  it('returns true for a valid signature', () => {
    const ok = verifyStripeSignature({
      rawBody: '{"id":"evt_123"}',
      signatureHeader: 't=123,v1=testsignature',
      secret: 'whsec_test',
    });

    expect(typeof ok).toBe('boolean');
  });
});
```

## Integration Test Examples

Integration tests should verify component behavior at real boundaries while still running in a controlled environment. For this platform, the preferred setup is Firebase Emulator Suite plus mocked external APIs.

Recommended integration-test coverage:

- callable functions with authenticated and unauthenticated requests
- Firestore triggers reacting to document create and update events
- Storage triggers for resume and JD uploads
- webhook handlers with valid and invalid signatures
- Firestore Security Rules behavior by role
- end-to-end credit ledger updates across message and payment flows

### Example: `acceptMessage` callable flow

Test goal:

- seed a message in `sent` state
- authenticate as the employer recipient
- invoke `acceptMessage`
- verify the response is successful
- verify a `conversations/{conversationId}` record exists
- verify the message status is updated as expected

Illustrative example:

```ts
it('accepts a message and creates a conversation', async () => {
  await seedMessage({
    id: 'msg_123',
    fromUserId: 'seeker_1',
    toUserId: 'employer_1',
    status: 'sent',
  });

  const client = authedFunctionsClient({ uid: 'employer_1', role: 'employer' });
  const result = await client.call('acceptMessage', { messageId: 'msg_123' });

  expect(result.data.success).toBe(true);

  const conversation = await getConversationByMessageId('msg_123');
  expect(conversation).toBeDefined();
});
```

### Example: payment webhook fulfillment

Test goal:

- send a signed Stripe or Razorpay webhook request
- verify the signature check passes
- verify credits are added once
- replay the same event
- verify the second delivery is ignored due to idempotency

### Example: Storage-triggered resume parsing

Test goal:

- upload a test PDF to the Storage emulator
- trigger `parseResume`
- mock the Claude response
- verify the parsed document is written to `resumes/{userId}`
- verify invalid MIME types are rejected safely

### Example: Firestore Security Rules

Test goal:

- confirm a job seeker can create an application for themselves
- confirm a different seeker cannot read another seeker’s protected application
- confirm a client cannot write directly to `credits/{userId}`
- confirm only authorized users can read `messages/{messageId}`

## Running Tests Locally

The exact command names may vary slightly by repository, but the local workflow should follow the same sequence across environments.

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase CLI
- local environment variables configured as described in `SETUP.md`

### 1. Install dependencies

```bash
cd job-portal-shared-lib && npm install
cd ../job-portal-backend/functions && npm install
cd ../../job-portal-web && npm install
```

### 2. Start Firebase emulators

```bash
cd job-portal-config
firebase emulators:start
```

Recommended emulator services:

- Auth
- Firestore
- Storage
- Functions

### 3. Run unit tests

Shared library:

```bash
cd job-portal-shared-lib
npm test
```

Backend:

```bash
cd job-portal-backend/functions
npm test
```

Web:

```bash
cd job-portal-web
npm test
```

If the mobile repositories define local test tasks, run them as part of the same validation pass:

Android:

```bash
cd job-portal-android
./gradlew test
```

iOS:

```bash
cd job-portal-ios
xcodebuild test -workspace JobPortal.xcworkspace -scheme JobPortal -destination 'platform=iOS Simulator,name=iPhone 15'
```

### 4. Run integration tests against emulators

Backend integration suite:

```bash
cd job-portal-backend/functions
npm run test:integration
```

Security-rules suite:

```bash
cd job-portal-config
npm test
```

### 5. Generate coverage locally

```bash
npm run test:coverage
```

If repositories are split, generate coverage in each repo and publish the results separately or merge them in CI.

## Coverage Targets

Coverage should be treated as a floor, not the definition of quality. A high percentage is not sufficient if financial or authorization paths are untested.

Recommended minimum targets:

| Area | Line coverage | Branch coverage | Notes |
| --- | --- | --- | --- |
| Shared library | 90% | 85% | Validators, constants, and domain helpers should be highly covered |
| Cloud Functions | 85% | 80% | Prioritize message, credit, webhook, and AI workflow logic |
| Web client | 80% | 75% | Focus on stateful flows, forms, and API adapters |
| Android / iOS | 70% | 65% | Focus on view models, mappers, and offline-safe logic |
| Security rules and integration suite | scenario-based | scenario-based | Enforce critical access and lifecycle cases rather than only percentages |

Coverage must explicitly include these high-risk scenarios:

- invalid or missing auth on callable functions
- unauthorized reads and writes blocked by rules
- duplicate webhook delivery ignored
- insufficient-credit path handled safely
- message expiry and refund logic
- parsing failure does not corrupt source records

## CI/CD Setup

CI/CD should block deployment unless tests, linting, build steps, and minimum coverage thresholds all pass. The recommended pattern is pull-request validation plus protected deployment jobs.

### Pull request pipeline

Run on every PR and every push to protected branches:

1. install dependencies with clean lockfile resolution
2. build shared packages first
3. lint all affected repositories
4. run unit tests
5. start Firebase emulators for integration suites
6. run backend and rules integration tests
7. publish coverage artifacts and test reports

Recommended gates:

- all tests passing
- coverage thresholds met
- no critical lint or typecheck failures
- no deployment on pull-request jobs

### Main-branch deployment pipeline

Run only after merge to the protected production branch:

1. rerun the full verification suite
2. package Cloud Functions and web artifacts
3. deploy Firestore rules and indexes
4. deploy Cloud Functions
5. deploy web application
6. optionally run post-deploy smoke tests against production or staging

### Example GitHub Actions layout

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - run: npm run test:coverage
      - run: firebase emulators:exec --project demo-test "npm run test:integration"

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: firebase deploy --only functions,firestore:rules,firestore:indexes,storage
```

### Secrets and environment handling

CI secrets should include only what is required for the target environment:

- Firebase deployment credentials
- Claude API key for integration tests only if a real external test is intentionally enabled
- Stripe and Razorpay webhook secrets for signature tests if not mocked
- SendGrid key only for explicitly gated integration tests, otherwise mock email delivery

Use mocked external services by default in CI. Real third-party calls should be limited to dedicated smoke environments and must never run on every pull request.

## Release Readiness Checklist

Before a production deployment, confirm:

- unit and integration suites passed on the merge commit
- coverage thresholds were met
- webhook idempotency scenarios passed
- credit mutation scenarios passed
- Firestore authorization scenarios passed
- emulator-backed integration tests passed
- any post-deploy smoke checks succeeded

## Maintenance Guidance

- Add tests for every new callable function, webhook, and trigger before release.
- Treat every security rule change as a required integration-test update.
- Add regression tests for every production incident involving credits, auth, parsing, or messaging lifecycle state.
- Keep fixtures small, readable, and business-focused so failures are easy to diagnose.
