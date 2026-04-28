# E2E Testing — No Real API Keys Required

This guide runs full end-to-end tests against the Firebase Emulator Suite.
Zero Stripe / Razorpay / Claude / SendGrid keys needed.

---

## Prerequisites

Install once:

```bash
# Node 20
node --version   # must be >= 20

# Firebase CLI
npm install -g firebase-tools

# Install backend dependencies
cd job-portal-backend/functions
npm install
```

---

## Step 1 — Start the Firebase Emulator

From the `job-portal-config/` directory:

```bash
cd job-portal-config
firebase emulators:start --project demo-test
```

This starts:

| Service   | Local URL                    |
|-----------|------------------------------|
| Firestore | http://localhost:8080        |
| Auth      | http://localhost:9099        |
| Storage   | http://localhost:9199        |
| Functions | http://localhost:5001        |
| UI        | http://localhost:4000        |

> `demo-test` is a special Firebase project ID prefix (`demo-*`).
> No real Firebase account or project is needed.

Leave this terminal running.

---

## Step 2 — Run Unit Tests (no emulator needed)

In a second terminal:

```bash
cd job-portal-backend/functions
npm test
```

Runs: `src/__tests__/fitScore.test.ts` and `src/__tests__/creditDeduction.test.ts`

All external APIs (Claude, SendGrid) are mocked via `jest.mock()`.
No emulator required. No network calls made.

Expected output:
```
PASS src/__tests__/fitScore.test.ts        (9 tests)
PASS src/__tests__/creditDeduction.test.ts (9 tests)
```

---

## Step 3 — Run Integration Tests (emulator required)

With the emulator running (Step 1):

```bash
cd job-portal-backend/functions
npm run test:integration
```

Runs: `__tests__/integration.test.ts`

Covers these flows end-to-end against real Firestore:

| Flow | What is verified |
|------|-----------------|
| Message send → view → credit deduction | Credit balance decremented, message flagged `creditDeducted: true` |
| Double-view guard | Second view does not deduct again |
| Application created → fit score | `fit_score: 78`, `status: success` written to application doc |
| Payment → credits added | `balance` and `totalAdded` incremented, transaction logged |
| Zero credit rejection | `addCredits(userId, 0)` throws |

Claude is mocked (returns `fit_score: 78` fixture).
SendGrid is not called (email errors are swallowed in source).
Stripe/Razorpay webhook signatures are not tested here (see Step 4).

---

## Step 4 — Test Webhook Endpoints Manually

With the emulator running and functions built (`npm run build`):

### Fake Stripe webhook — add credits

```bash
curl -s -X POST \
  "http://localhost:5001/demo-test/us-central1/stripeWebhook" \
  -H "Content-Type: application/json" \
  -H "stripe-signature: emulator-skip" \
  -d '{
    "type": "payment_intent.succeeded",
    "id": "evt_test_001",
    "data": {
      "object": {
        "id": "pi_test_001",
        "amount": 1000,
        "currency": "usd",
        "metadata": {
          "userId": "seeker1",
          "credits": "10",
          "plan": "starter"
        }
      }
    }
  }'
```

Expected response: `OK`

Then verify in Firestore Emulator UI (http://localhost:4000):
- `users/seeker1.balance` increased by 10
- `users/seeker1/credit_transactions` has a new `type: purchase` document

### Fake Razorpay webhook — add credits

```bash
curl -s -X POST \
  "http://localhost:5001/demo-test/us-central1/razorpayWebhook" \
  -H "Content-Type: application/json" \
  -H "x-razorpay-signature: emulator-skip" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test_001",
          "amount": 50000,
          "currency": "INR",
          "notes": {
            "userId": "seeker1",
            "credits": "5",
            "plan": "basic"
          }
        }
      }
    }
  }'
```

Expected response: `OK`

> **Note:** Signature verification is currently active in both webhooks.
> To test locally without a real Stripe/Razorpay webhook secret, you need to
> temporarily disable the signature check for local testing by setting
> `STRIPE_WEBHOOK_SECRET=` (empty) in your local env — the `?? ''` fallback
> in the code means an empty secret will accept any payload.

---

## Step 5 — Run Everything Together

```bash
# Terminal 1: Start emulator
cd job-portal-config && firebase emulators:start --project demo-test

# Terminal 2: Run all tests
cd job-portal-backend/functions && npm run test:all
```

---

## What Is NOT Covered Here

| Gap | How to cover it |
|-----|----------------|
| Real Stripe payment UI flow | Get free Stripe test account + `pk_test_` keys |
| Real email delivery | Sign up for free SendGrid account or use Mailtrap |
| Real Claude AI response quality | Use Anthropic API key with small fixture resumes |
| iOS/Android device testing | Requires Xcode/Android Studio + emulator devices |
| Firebase Security Rules enforcement | Run `firebase emulators:exec` with rules test suite |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Emulator connection failed` | Confirm `firebase emulators:start` is running on port 8080 |
| `Cannot find module` | Run `npm install` in `job-portal-backend/functions/` |
| `FIREBASE_PROJECT_ID missing` | The integration test sets this automatically — run via `npm run test:integration`, not `jest` directly |
| Functions not found in emulator | Run `npm run build` before starting the emulator |
