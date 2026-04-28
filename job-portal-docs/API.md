# Job Portal — Cloud Functions API Reference

**Base URL:** `https://<region>-<project-id>.cloudfunctions.net`

---

## Authentication

| Type | How |
|---|---|
| Callable functions | Firebase Auth ID token |
| Webhook endpoints | HMAC SHA256 signature header |
| Triggers | Internal (Firebase Admin) — not client-callable |

---

## Rate Limits

Callable functions use Firebase default quotas (≈1M calls/month free tier). Webhook endpoints are delivery-rate-limited by Stripe/Razorpay. Background triggers are bound by Firestore/Storage write throughput.

---

## Error Codes

| Code | HTTP | Meaning |
| --- | --- | --- |
| `unauthenticated` | 401 | Missing or invalid Firebase Auth token |
| `invalid-argument` | 400 | Malformed or missing request fields |
| `permission-denied` | 403 | Authenticated but not authorized |
| `not-found` | 404 | Resource does not exist |
| `already-exists` | 409 | Action already performed |
| `failed-precondition` | 412 | State mismatch (e.g. insufficient credits) |
| `internal` | 500 | Unexpected server error |
| `unavailable` | 503 | Upstream service unreachable |

---

## Callable Functions

### `missingSkills`
AI-powered skill gap analysis. Requires premium subscription.

**Auth:** Required · **Timeout:** 30s

**Request:**
```json
{ "jobId": "job_abc", "applicationId": "app_xyz" }
```
**Response:**
```json
{
  "skill_gaps": [
    { "skill": "Kubernetes", "learn_time_months": 3,
      "resources": ["https://kubernetes.io/docs"], "job_impact": "Required for deployment" }
  ]
}
```
**Errors:** `unauthenticated` · `invalid-argument` (missing ids) · `permission-denied` (not owner or not premium) · `not-found` · `failed-precondition` (no fit score yet) · `internal`

---

### `acceptMessage`
Employer accepts a job seeker's message. Creates a conversation (30-day expiry) and deducts 1 credit from the seeker.

**Auth:** Required (must be the intended recipient) · **Timeout:** 30s

**Request:** `{ "messageId": "msg_123" }`  
**Response:** `{ "success": true, "messageId": "msg_123", "timestamp": "2026-04-18T02:00:00Z" }`  
**Errors:** `unauthenticated` · `invalid-argument` · `not-found` · `permission-denied` · `already-exists` · `failed-precondition` (expired or insufficient credits)

---

### `rejectMessage`
Employer rejects a message. Blocks seeker from messaging this employer for 30 days.

**Auth:** Required (must be the intended recipient) · **Timeout:** 30s

**Request:** `{ "messageId": "msg_123", "reason": "Not a fit." }` — `reason` max 500 chars  
**Response:** `{ "success": true, "messageId": "msg_123", "timestamp": "2026-04-18T02:00:00Z" }`  
**Errors:** Same as `acceptMessage`, plus `invalid-argument` if reason missing or >500 chars

---

## Webhook Endpoints (HTTP POST)

### `POST /stripeWebhook`
Processes `payment_intent.succeeded` to add credits.

**Auth:** `stripe-signature` header (HMAC SHA256)  
**Required payment metadata:** `{ "userId": "uid", "credits": "50", "plan": "pro" }`

| Status | Meaning |
|---|---|
| 200 | Processed or ignored |
| 400 | Bad/missing signature |
| 500 | Fulfillment error |

Idempotent — duplicate `payment_intent` IDs are ignored.

---

### `POST /razorpayWebhook`
Processes `payment.captured` to add credits. Amount in paise (÷100 = rupees).

**Auth:** `x-razorpay-signature` header (timing-safe HMAC SHA256)  
**Required payment notes:** `{ "userId": "uid", "credits": "50", "plan": "pro" }`

Responses same as Stripe. Idempotent on `razorpayPaymentId`.

---

## Background Triggers

These fire automatically. Not client-callable.

### `fitScore` — Firestore onCreate `applications/{applicationId}`
Computes AI fit score on new application. Updates document:
```json
{ "fit_score": 82, "matched_skills": ["Python"], "missing_skills": ["K8s"],
  "recommendation": "Strong candidate", "status": "success" }
```

### `parseResume` — Storage onFinalize `resumes/{userId}/*`
Parses PDF/DOCX resumes (max 5 MB). Writes to Firestore `resumes/{userId}`:
```json
{
  "parsed": { "name": "Jane Doe", "email": "jane@example.com", "skills": ["Python"],
    "experience": [{ "title": "SWE", "company": "Acme", "duration": "2y", "description": "..." }],
    "education": [{ "degree": "B.S. CS", "institution": "MIT", "year": "2020" }] },
  "status": "success"
}
```
Supported MIME: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### `parseJD` — Storage onFinalize `jobs/{jobId}/*`
Parses job description files (same constraints). Writes to Firestore `jobs/{jobId}`:
```json
{
  "parsed": { "title": "Backend Engineer", "skills": ["Python", "K8s"],
    "experience_years": 5, "salary_range": { "min": 120000, "max": 160000, "currency": "USD" } },
  "status": "success"
}
```

### `sendMessage` — Firestore onCreate `messages/{messageId}`
Validates a new message document and emails the employer. Body ≤ 2000 chars; sender must be `job_seeker`, recipient must be `employer`. Sets `status: "sent"` with `expiresAt` (+7 days) or `status: "invalid"`.

### `deductCredit` — Firestore onUpdate `messages/{messageId}`
Fires on `sent → seen` transition. Deducts 1 credit from sender. Sets `creditDeducted: true`. On failure sets `creditError: "insufficient_credits"`.

### `refundCredit` — Firestore onUpdate `messages/{messageId}`
Fires on `sent → expired` when credit was never deducted. Refunds 1 credit and sends email. Sets `creditRefunded: true`.

---

## Scheduled Functions

| Function | Schedule | Description |
| --- | --- | --- |
| `refundExpiredMessages` | Daily 2 AM UTC | Refunds credits for `sent` messages >7 days old. Batches of 100, 10 concurrent, idempotent. |
| `cleanupOldData` | Sundays 2 AM UTC | Deletes inactive conversations >90 days, rejected messages >30 days, archives old chats, purges `temp/` uploads >30 days. |
