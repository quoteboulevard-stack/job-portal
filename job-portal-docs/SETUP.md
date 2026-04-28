# Job Portal — Setup Guide

## Prerequisites

| Tool | Minimum version |
| --- | --- |
| Node.js | 20 |
| npm | 10 |
| Firebase CLI | latest (`npm i -g firebase-tools`) |
| Java (Android) | 17 (JDK) |
| Xcode (iOS) | 15 |
| Android Studio | Hedgehog or later |

Accounts required before starting:

- [Firebase console](https://console.firebase.google.com) — create a project
- [Anthropic](https://console.anthropic.com) — Claude API key
- [SendGrid](https://app.sendgrid.com) — API key + verified sender domain
- [Stripe](https://dashboard.stripe.com) — secret key + webhook signing secret
- [Razorpay](https://dashboard.razorpay.com) — key id + key secret *(optional)*

---

## 1. Clone Repositories

Each concern lives in its own repository under a shared parent directory.

```bash
mkdir job-portal && cd job-portal

git clone <job-portal-backend-url>     job-portal-backend
git clone <job-portal-web-url>         job-portal-web
git clone <job-portal-config-url>      job-portal-config
git clone <job-portal-shared-lib-url>  job-portal-shared-lib
git clone <job-portal-android-url>     job-portal-android
git clone <job-portal-ios-url>         job-portal-ios
git clone <job-portal-docs-url>        job-portal-docs
```

---

## 2. Install Dependencies

### Shared library

```bash
cd job-portal-shared-lib
npm install
npm run build
```

### Backend (Cloud Functions)

```bash
cd job-portal-backend/functions
npm install
```

### Web

```bash
cd job-portal-web
npm install
```

### Android

Open `job-portal-android/` in Android Studio. Gradle syncs automatically on first open.

### iOS

```bash
cd job-portal-ios
pod install        # if CocoaPods is used
open JobPortal.xcworkspace
```

---

## 3. Firebase Project Setup

### 3a. Create the Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**.
2. Enable **Google Analytics** if desired.
3. In **Build → Authentication**, enable the sign-in methods your app uses (Email/Password at minimum).
4. In **Build → Firestore Database**, create a database in production mode.
5. In **Build → Storage**, create a default bucket.
6. In **Build → Cloud Messaging**, no action needed — FCM is enabled by default.

### 3b. Link the CLI

```bash
firebase login
firebase use --add          # select your project and give it an alias, e.g. "production"
```

### 3c. Deploy Firestore rules and indexes

```bash
cd job-portal-config
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only storage
```

### 3d. Generate a service account key

1. Firebase console → **Project settings → Service accounts**.
2. Click **Generate new private key** and download the JSON file.
3. Keep this file secret and never commit it to source control.

Convert it to a single-line JSON string for use as an environment variable:

```bash
cat service-account.json | jq -c .
```

---

## 4. Configure Environment Variables

### Backend (`job-portal-backend/functions/.env`)

Copy the example file and fill in every value:

```bash
cp .env.example .env
```

```bash
# ─── Firebase (Admin SDK) ────────────────────────────────────────────────────
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com

# ─── Claude (Anthropic) ──────────────────────────────────────────────────────
CLAUDE_API_KEY=sk-ant-api03-...

# ─── Stripe ──────────────────────────────────────────────────────────────────
STRIPE_SECRET=sk_live_...

# ─── SendGrid ────────────────────────────────────────────────────────────────
SENDGRID_KEY=SG....

# ─── Optional ────────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=8080
LOG_LEVEL=info
```

> **Note:** `FIREBASE_PRIVATE_KEY` must contain literal `\n` characters. If you paste from the JSON file, replace actual newlines with `\n`.

### Web (`job-portal-web/.env.local`)

```bash
# Firebase — public config (safe to expose to browser)
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_USE_EMULATOR=false
```

Find these values in Firebase console → **Project settings → General → Your apps**.

### Android (`job-portal-android/app/google-services.json`)

1. Firebase console → **Project settings → Your apps → Add app → Android**.
2. Register the package name (e.g. `com.jobportal.app`).
3. Download `google-services.json` and place it in `job-portal-android/app/`.

### iOS (`job-portal-ios/GoogleService-Info.plist`)

1. Firebase console → **Project settings → Your apps → Add app → iOS**.
2. Register the bundle ID.
3. Download `GoogleService-Info.plist` and add it to the Xcode project root.

---

## 5. Payment Gateway Setup

### Stripe

1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → API keys**.
2. Copy the **Secret key** (`sk_live_…`) into `STRIPE_SECRET`.
3. Go to **Developers → Webhooks → Add endpoint**.
   - URL: `https://<region>-<project-id>.cloudfunctions.net/stripeWebhook`
   - Event: `payment_intent.succeeded`
4. Copy the **Signing secret** and store it alongside `STRIPE_SECRET` if your function reads it separately.
5. Every `PaymentIntent` must include metadata:
   ```json
   { "userId": "<firebase-uid>", "credits": "50", "plan": "pro" }
   ```

### Razorpay *(optional)*

1. [dashboard.razorpay.com](https://dashboard.razorpay.com) → **Settings → API Keys**.
2. Copy **Key ID** and **Key Secret** into your environment (names used in code: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
3. Go to **Settings → Webhooks → Add new webhook**.
   - URL: `https://<region>-<project-id>.cloudfunctions.net/razorpayWebhook`
   - Event: `payment.captured`
4. Every payment must include notes:
   ```json
   { "userId": "<firebase-uid>", "credits": "50", "plan": "pro" }
   ```

---

## 6. Run Locally

### Firebase Emulators (backend + Firestore + Auth + Storage)

```bash
cd job-portal-config
firebase emulators:start
```

Emulator ports:

| Service | Port |
| --- | --- |
| Emulator UI | 4000 |
| Hosting | 5000 |
| Cloud Functions | 5001 |
| Firestore | 8080 |
| Auth | 9099 |
| Storage | 9199 |

### Cloud Functions (watch mode)

In a separate terminal:

```bash
cd job-portal-backend/functions
npm run build:watch
```

### Web

```bash
cd job-portal-web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Android

In Android Studio: select the emulator or connected device and click **Run**.

Ensure the emulator or device can reach your local Firebase emulators if testing against them. Update the Firebase SDK's emulator host configuration inside the app before running locally.

### iOS

In Xcode: select a simulator and press **Cmd+R**.

---

## 7. Deploy to Production

### 7a. Set Cloud Functions environment secrets

Use Firebase Functions config or Secret Manager. The simplest approach:

```bash
cd job-portal-backend/functions
firebase functions:secrets:set CLAUDE_API_KEY
firebase functions:secrets:set STRIPE_SECRET
firebase functions:secrets:set SENDGRID_KEY
```

Alternatively, set environment variables in the Firebase console under **Functions → All functions → (select a function) → Edit**.

### 7b. Deploy Cloud Functions

```bash
cd job-portal-config
firebase deploy --only functions
```

### 7c. Deploy Firestore rules and indexes

```bash
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only storage
```

### 7d. Deploy web hosting

```bash
cd job-portal-web
npm run build
cd ../job-portal-config
firebase deploy --only hosting
```

### 7e. Verify scheduled jobs

Two scheduled Cloud Functions run on Pub/Sub schedules defined in code:

| Function | Schedule |
| --- | --- |
| `refundExpiredMessages` | Daily 2 AM UTC |
| `cleanupOldData` | Sundays 2 AM UTC |

After deploying, confirm both appear in **Google Cloud Console → Cloud Scheduler** and are in the **Enabled** state.

### 7f. Deploy mobile apps

- **Android:** Build a release APK/AAB via Android Studio or `./gradlew bundleRelease`, then upload to Google Play Console.
- **iOS:** Archive in Xcode (**Product → Archive**), then distribute via App Store Connect.

---

## 8. Verify the Deployment

```bash
# Confirm functions are live
firebase functions:list

# Tail logs for any startup errors
firebase functions:log --only fitScore,stripeWebhook,refundExpiredMessages
```

Send a test Stripe webhook event:

```bash
stripe trigger payment_intent.succeeded \
  --override payment_intent:metadata.userId=test-uid \
  --override payment_intent:metadata.credits=10 \
  --override payment_intent:metadata.plan=basic
```

Check Firestore → `credits/test-uid` for the updated balance.

---

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Functions fail to start | Missing required env var — check `validateEnv.ts` required list |
| `FIREBASE_PRIVATE_KEY` auth error | Escaped `\n` not converted to real newlines — wrap value in quotes |
| Stripe webhook returns 400 | Signing secret mismatch or wrong event type registered |
| FCM push not delivered | `fcmToken` missing on user document or stale token not cleaned up |
| Resume parse returns error | File exceeds 5 MB or unsupported MIME type |
| Emulators not reached by app | App not configured to point to emulator host/port |
