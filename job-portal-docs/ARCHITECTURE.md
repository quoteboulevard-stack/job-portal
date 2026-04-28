# Job Portal Architecture Overview

> Supporting ASCII diagrams are in [diagrams/system.md](diagrams/system.md).

## System Overview

Job Portal is a Firebase-centered, multi-client hiring platform serving web, Android, and iOS applications. The clients use Firebase client SDKs for authentication, real-time data access, file uploads, and push notifications. Business workflows that require privileged access or cross-system coordination are handled in Firebase Cloud Functions.

The architecture is event-driven at the edges and document-driven at the core:

- Clients create and read operational records in Firestore.
- Cloud Functions react to Firestore and Storage events for validation, enrichment, notifications, and lifecycle management.
- External systems are used only for bounded responsibilities:
  - Claude API for document parsing and match analysis
  - SendGrid for transactional email
  - Stripe and Razorpay for payment processing

At a high level, Firestore is the system of record for users, jobs, applications, messages, credits, and notifications. Storage holds uploaded resumes and job-description files. Cloud Functions enforce privileged workflows such as credit mutation, payment fulfillment, conversation creation, scheduled cleanup, and AI-driven enrichment.

```
Clients (Web, Android, iOS)
        |
        v
Firebase Client SDKs
        |
        v
Firebase Services
Auth | Firestore | Storage | FCM
        |
        v
Cloud Functions (trusted backend boundary)
        |
        +--> Claude API
        +--> SendGrid
        +--> Stripe / Razorpay
```

## Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Web client | Next.js + TypeScript | Browser application for seekers and employers |
| Android client | Kotlin + Jetpack Compose | MVVM / clean architecture mobile app |
| iOS client | Swift + SwiftUI | MVVM mobile app |
| Backend | Firebase Cloud Functions, Node.js, TypeScript | Callable functions, webhooks, triggers, schedulers |
| Primary datastore | Cloud Firestore | Operational source of truth |
| File storage | Firebase Storage | Resume and job-description uploads |
| Authentication | Firebase Authentication | Identity and session validation |
| Notifications | Firebase Cloud Messaging | Push delivery to mobile/web clients |
| Email | SendGrid | Transactional email events |
| AI processing | Claude API | Resume parsing, JD parsing, fit scoring |
| Payments | Stripe, Razorpay | Credit purchases and webhook fulfillment |
| Shared contract layer | `job-portal-shared-lib` | Types, validation helpers, constants, error models |

## Data Flow

The platform is organized around a small set of business flows. The diagrams in [diagrams/system.md](diagrams/system.md) show the same flows visually.

### 1. User and session flow

1. A client authenticates with Firebase Authentication.
2. The client receives a Firebase ID token and uses it for authenticated operations.
3. Firestore Security Rules enforce collection-level and role-aware access.
4. Cloud Functions use the Firebase Admin SDK for privileged server-side actions that must not be allowed from clients.

### 2. Messaging and conversation flow

1. A job seeker creates a `messages/{messageId}` document.
2. A Firestore trigger validates sender, recipient, and content limits, then marks the message lifecycle state.
3. The employer is notified by email and can later accept or reject the message via callable functions.
4. Accepting a message creates a `conversations/{conversationId}` record and opens a time-bounded conversation window.
5. Message and conversation lifecycle updates may deduct or refund credits depending on state transitions and expiry rules.

Primary message lifecycle:

`sent -> seen -> accepted | rejected | expired`

### 3. Resume, job-description, and fit-scoring flow

1. A client uploads a resume or job-description file to Firebase Storage.
2. A Storage trigger validates file type and size.
3. Cloud Functions submit the file content to Claude for structured extraction.
4. Parsed outputs are written back to Firestore in server-managed documents.
5. When an application is created, a Firestore trigger compares candidate and job data to compute fit metadata.

### 4. Payment and credits flow

1. A client initiates payment using Stripe or Razorpay.
2. The payment provider sends a signed webhook to Cloud Functions.
3. The webhook handler verifies the signature and enforces idempotency.
4. Credits are written server-side to `credits/{userId}` and the transaction is recorded.
5. Confirmation email and in-app notifications are generated as needed.

### 5. Scheduled maintenance flow

Scheduled Cloud Functions enforce retention and financial consistency:

- refund expired messages that did not complete their intended workflow
- delete or archive stale operational records
- purge temporary uploads outside retention windows

## Firestore Schema Overview

The schema uses top-level collections for primary business entities. Client write access is intentionally narrow; several documents are server-managed even when readable by clients.

### `users/{userId}`

Canonical profile record for authenticated users.

```text
role: 'job_seeker' | 'employer' | 'admin'
email
name
avatarUrl
createdAt
updatedAt

job_seeker fields:
- resumeUrl
- skills[]
- experienceYears
- fcmToken

employer fields:
- company
- companyLogoUrl
```

### `jobs/{jobId}`

Employer-authored job posting and search metadata.

```text
employerId
title
company
description
requirements[]
skills[]
experienceYears
salary: { min, max, currency } | null
mode: 'remote' | 'hybrid' | 'onsite'
location
createdAt
updatedAt
expiresAt
```

### `applications/{applicationId}`

Join record between a job seeker and a job, plus review and AI fit state.

```text
userId
jobId
status: 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'withdrawn'
fit_score: number | null
fitDetail: {
  matched_skills[]
  missing_skills[]
  recommendation
}
resumeUrl
coverNote
createdAt
updatedAt
```

Application lifecycle:

`pending -> reviewed -> accepted | rejected | withdrawn`

### `messages/{messageId}`

Initial employer-contact channel initiated by a job seeker.

```text
fromUserId
toUserId
body
status: 'sent' | 'seen' | 'accepted' | 'rejected' | 'expired'
creditDeducted: boolean
creditRefunded?: boolean
createdAt
expiresAt
acceptedAt?
rejectedAt?
rejectionReason?
```

### `conversations/{conversationId}`

Server-created record representing an accepted message thread.

```text
messageId
jobSeekerId
employerId
status: 'active' | 'closed'
createdAt
expiresAt
```

### `credits/{userId}`

Server-managed credit ledger and current balance view.

```text
available
used
total
transactions[]: {
  type
  amount
  balanceAfter
  reason
  referenceId
  date
}
```

Transaction types include `purchase`, `deduction`, `refund`, and `topup`.

### `resumes/{userId}`

Server-managed parsed resume output derived from Storage uploads.

Representative shape:

```text
parsed: {
  name
  email
  skills[]
  experience[]
  education[]
}
status
updatedAt
```

### Parsed job metadata for `jobs/{jobId}`

AI-enriched job data is written back by Cloud Functions after job-description parsing. Clients should treat this as system-generated metadata, not user-authored source content.

Representative shape:

```text
parsed: {
  title
  skills[]
  experience_years
  salary_range
}
status
updatedAt
```

### `notifications/{notificationId}`

In-app notification fan-out for user-visible events.

```text
userId
type
title
body
read: boolean
referenceId?
createdAt
```

Representative notification types include message lifecycle updates, job match events, and credit purchase or refund events.

### Operational collections

The backend also references operational or internal-purpose collections such as `sessions`, `auditLogs`, `orders`, and `products`. These should be treated as service-facing support data rather than primary domain entities.

## Security Model Summary

The security model relies on three layers working together: Firebase Authentication, Firestore Security Rules, and Cloud Functions running with the Admin SDK.

### Authentication and identity

- Authenticated client operations require a valid Firebase ID token.
- Public read access is limited to explicitly public resources such as job listings.
- Administrative or financial actions are never trusted from client assertions alone.

### Authorization boundaries

| Collection / resource | Read policy | Write policy |
| --- | --- | --- |
| `users` | Owner or admin | Owner-managed profile fields only; no self-promotion |
| `jobs` | Public read | Employer can manage own jobs; admin retains elevated control |
| `applications` | Job seeker and owning employer | Seeker creates; employer updates review state |
| `messages` | Sender and recipient | Sender creates; lifecycle transitions are restricted |
| `conversations` | Participating users | Created and managed by trusted backend workflows |
| `credits` | Owner read | Client writes denied; backend only |
| Parsed resume / job metadata | Restricted to appropriate user scope | Cloud Functions only |
| Catch-all unmatched paths | Denied | Denied |

### Privileged workflow isolation

Sensitive actions are isolated behind Cloud Functions:

- payment webhook fulfillment
- credit deduction and refund
- conversation creation
- scheduled cleanup and expiry processing
- AI enrichment writes

This pattern prevents clients from directly mutating balances, bypassing lifecycle checks, or writing system-derived records.

### Webhook protection

- Stripe webhooks are validated using the `stripe-signature` header.
- Razorpay webhooks are validated using the `x-razorpay-signature` header.
- Payment handlers enforce idempotency before credit fulfillment to prevent duplicate grants.

### Data protection principles

- Default posture is deny unless a collection has an explicit allow rule.
- Role immutability is enforced so users cannot elevate themselves by updating `role`.
- Server-side records that affect money, access, or derived intelligence are written only by trusted backend code.

## Operational Notes

### Environment configuration

The production deployment depends on:

- Firebase client configuration for web and mobile clients
- Firebase service-account credentials for the backend
- Claude, SendGrid, Stripe, and Razorpay secrets
- standard runtime variables such as `NODE_ENV` and logging configuration

### Scheduled jobs

| Job | Schedule | Purpose |
| --- | --- | --- |
| `refundExpiredMessages` | Daily at 2:00 AM UTC | Refund eligible expired message credits |
| `cleanupOldData` | Sundays at 2:00 AM UTC | Remove or archive stale conversations, messages, and temporary uploads |

### Shared contract layer

`job-portal-shared-lib` provides shared types, validators, constants, and error contracts used by the web application and Cloud Functions. It reduces drift between client and backend validation rules and keeps business constants consistent across execution environments.
