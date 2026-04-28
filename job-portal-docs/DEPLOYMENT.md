# Job Portal — Deployment Guide

> **Prerequisites:** Complete [SETUP.md](SETUP.md) before deploying. This guide covers production deployments only.

---

## Deployment Overview

| Target | Platform | Trigger |
| --- | --- | --- |
| Web frontend | Vercel | Push to `main` (auto) or `vercel --prod` |
| Cloud Functions | Firebase | `firebase deploy --only functions` |
| Firestore rules & indexes | Firebase | `firebase deploy --only firestore` |
| Storage rules | Firebase | `firebase deploy --only storage` |
| iOS app | App Store Connect | Xcode archive + upload |
| Android app | Google Play Console | Gradle release build + upload |

---

## 1. Web — Vercel

### 1a. Create the Vercel project

```bash
npm i -g vercel
cd job-portal-web
vercel link          # connect to existing project or create new
```

Or connect via the Vercel dashboard: **New Project → Import Git Repository → job-portal-web**.

Set the framework preset to **Next.js**. Vercel detects this automatically.

### 1b. Environment variables

In your web host or CI environment, add every `REACT_APP_*` variable for the production build:

| Variable | Where to find the value |
| --- | --- |
| `REACT_APP_FIREBASE_API_KEY` | Firebase console → Project settings → Your apps |
| `REACT_APP_FIREBASE_AUTH_DOMAIN` | Same — format: `<project-id>.firebaseapp.com` |
| `REACT_APP_FIREBASE_PROJECT_ID` | Same |
| `REACT_APP_FIREBASE_STORAGE_BUCKET` | Same — format: `<project-id>.appspot.com` |
| `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Same |
| `REACT_APP_FIREBASE_APP_ID` | Same |
| `REACT_APP_USE_EMULATOR` | `false` in production |

Add the same variables to your preview or staging environment using development Firebase values.

### 1c. Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main (if Git integration is connected)
git push origin main
```

Vercel builds `next build` and serves from `.next/`. The build output is static + serverless — no server process to manage.

### 1d. Custom domain

Vercel Dashboard → **Project → Settings → Domains → Add**. Point your DNS `CNAME` to `cname.vercel-dns.com` or use Vercel nameservers for automatic SSL.

### 1e. Preview deployments

Every pull request gets a unique preview URL automatically. Use the **Preview** environment variables (pointing at your Firebase dev project) so preview deployments never touch production data.

---

## 2. Backend — Firebase Cloud Functions

### 2a. Target project

```bash
cd job-portal-config
firebase use production    # alias set during setup
firebase projects:list     # confirm the correct project is active
```

### 2b. Production secrets

Use Google Secret Manager (recommended over environment variables for sensitive keys):

```bash
# Run once per secret — Firebase CLI wraps Secret Manager
firebase functions:secrets:set CLAUDE_API_KEY
firebase functions:secrets:set STRIPE_SECRET
firebase functions:secrets:set SENDGRID_KEY
firebase functions:secrets:set FIREBASE_PRIVATE_KEY
firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
firebase functions:secrets:set SENDGRID_FROM_EMAIL

# Confirm secrets exist
firebase functions:secrets:list
```

Secrets are automatically injected at runtime. The `validateEnv.ts` check runs on cold start and will throw if any required value is missing.

### 2c. Build and deploy functions

```bash
cd job-portal-backend/functions
npm run build

cd ../../job-portal-config
firebase deploy --only functions
```

Runtime is `nodejs20` as declared in `firebase.json`. Do not change this without updating the Cloud Functions runtime in the Firebase console and re-deploying.

### 2d. Deploy Firestore rules, indexes, and Storage rules

```bash
cd job-portal-config

firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

Deploy rules and indexes independently of functions so a bad rule change can be rolled back without re-deploying all functions.

### 2e. Verify scheduled jobs

After deploying, open **Google Cloud Console → Cloud Scheduler** and confirm:

| Job | Schedule | Status |
| --- | --- | --- |
| `refundExpiredMessages` | `0 2 * * *` (daily 2 AM UTC) | Enabled |
| `cleanupOldData` | `0 2 * * 0` (Sundays 2 AM UTC) | Enabled |

If either job is missing, it was not deployed — re-run the functions deploy. If it exists but is paused, enable it manually or via:

```bash
gcloud scheduler jobs resume <job-name> --location=<region>
```

### 2f. Webhook URLs

Register these URLs in your payment dashboards after the first functions deploy:

| Gateway | Event | URL |
| --- | --- | --- |
| Stripe | `payment_intent.succeeded` | `https://<region>-<project-id>.cloudfunctions.net/stripeWebhook` |
| Razorpay | `payment.captured` | `https://<region>-<project-id>.cloudfunctions.net/razorpayWebhook` |

Verify the function URLs with:

```bash
firebase functions:list
```

### 2g. Rollback

Firebase does not provide one-command rollback. To revert:

1. Check out the previous commit in `job-portal-backend`.
2. Run `npm run build` then `firebase deploy --only functions`.

For rules, revert the rules file and redeploy with `--only firestore:rules`.

---

## 3. iOS — App Store

### 3a. Pre-release checklist

- [ ] `GoogleService-Info.plist` contains production Firebase project values
- [ ] Bundle ID matches the App Store Connect record
- [ ] Version number and build number incremented in Xcode target settings
- [ ] Push notification entitlement enabled (for FCM)
- [ ] App Store Connect app record exists with the correct bundle ID

### 3b. Configure signing

Xcode → **Signing & Capabilities**:

- Team: your Apple Developer account
- Provisioning Profile: **App Store Distribution**
- Signing Certificate: **Apple Distribution**

Use automatic signing (`Automatically manage signing`) for simplicity, or manage profiles manually via [developer.apple.com](https://developer.apple.com/account).

### 3c. Archive and upload

```
Product → Archive
```

When the archive succeeds, the Organizer opens automatically.

1. Select the archive → **Distribute App**.
2. Choose **App Store Connect** → **Upload**.
3. Keep default options (include bitcode if prompted, strip Swift symbols).
4. Click **Upload**.

The build appears in App Store Connect within a few minutes.

### 3d. Submit for review

App Store Connect → **your app → TestFlight** (internal test first, recommended) or **App Store → + Version**.

- Select the uploaded build.
- Fill release notes.
- Submit for Review.

Apple review typically takes 24–48 hours for first submissions and faster for updates.

### 3e. FCM setup for iOS

1. Apple Developer → **Certificates, IDs & Profiles → Keys** → create or locate your APNs key.
2. Firebase console → **Project settings → Cloud Messaging → Apple app configuration**.
3. Upload the APNs Auth Key (`.p8`) and enter the Key ID and Team ID.

Without this, push notifications will not be delivered on iOS.

---

## 4. Android — Google Play Store

### 4a. Pre-release checklist

- [ ] `google-services.json` contains production Firebase project values
- [ ] `versionCode` incremented in `build.gradle` (each upload must be unique)
- [ ] `versionName` updated to the release version string
- [ ] Release signing keystore configured (not the debug keystore)
- [ ] `minifyEnabled true` and `proguard-rules.pro` in release build type

### 4b. Configure release signing

In `job-portal-android/app/build.gradle`:

```groovy
android {
    signingConfigs {
        release {
            storeFile     file(KEYSTORE_PATH)
            storePassword KEYSTORE_PASSWORD
            keyAlias      KEY_ALIAS
            keyPassword   KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig     signingConfigs.release
            minifyEnabled     true
            proguardFiles     getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

Store keystore credentials in `~/.gradle/gradle.properties` or your CI secrets store — never in the repository.

### 4c. Build the release bundle

```bash
cd job-portal-android
./gradlew bundleRelease
```

Output: `app/build/outputs/bundle/release/app-release.aab`

Google Play requires AAB format. APK is only for direct distribution outside the Play Store.

### 4d. Upload to Play Console

1. [play.google.com/console](https://play.google.com/console) → select your app.
2. **Release → Production → Create new release**.
3. Upload the `.aab` file.
4. Write release notes.
5. **Review release → Start rollout** (staged rollout recommended: start at 10–20%).

### 4e. FCM setup for Android

`google-services.json` includes the `messagingSenderId` that FCM uses. No additional configuration is needed as long as the production `google-services.json` is in `app/`.

---

## 5. Environment Setup Summary

### Secrets by platform

| Secret | Vercel | Firebase Secret Manager | Android CI | iOS CI |
| --- | --- | --- | --- | --- |
| `REACT_APP_FIREBASE_*` | Yes | — | — | — |
| `FIREBASE_PROJECT_ID` | — | Yes | — | — |
| `FIREBASE_CLIENT_EMAIL` | — | Yes | — | — |
| `FIREBASE_PRIVATE_KEY` | — | Yes | — | — |
| `CLAUDE_API_KEY` | — | Yes | — | — |
| `STRIPE_SECRET` | — | Yes | — | — |
| `STRIPE_WEBHOOK_SECRET` | — | Yes | — | — |
| `SENDGRID_KEY` | — | Yes | — | — |
| `SENDGRID_FROM_EMAIL` | — | Yes | — | — |
| `google-services.json` | — | — | Encrypted file secret | — |
| `GoogleService-Info.plist` | — | — | — | Encrypted file secret |
| Keystore + credentials | — | — | Encrypted secrets | — |
| APNs key (`.p8`) | — | — | — | Encrypted file secret |

### Production vs. development projects

Always maintain two Firebase projects: one for production, one for development/staging. Mobile apps must use the correct `google-services.json` / `GoogleService-Info.plist` for each environment. Web uses separate Vercel environments (Production vs. Preview) with different `NEXT_PUBLIC_*` values.

---

## 6. Monitoring

### Firebase console

| View | What to watch |
| --- | --- |
| Functions → Logs | Cold start failures, unhandled exceptions, env var errors |
| Functions → Health | Error rates, invocation counts, p99 latency per function |
| Firestore → Usage | Read/write operations, active connections |
| Authentication → Users | Sign-up rate, sign-in failures |

### Cloud Logging (GCP)

All Cloud Functions logs flow to Google Cloud Logging. Create log-based alerts for:

```
resource.type="cloud_function"
severity>=ERROR
```

Set up alert policies in **Cloud Console → Monitoring → Alerting → Create policy**.

### Firebase Crashlytics

Enable Crashlytics in the Firebase console for both Android and iOS apps. It captures unhandled exceptions and ANRs with stack traces. After the first crash-free session, reports appear in **Firebase console → Crashlytics**.

### Stripe and Razorpay

- Stripe: **Dashboard → Developers → Webhooks** shows delivery attempts, response codes, and retry history. A `400` from `stripeWebhook` indicates a signature mismatch.
- Razorpay: **Dashboard → Settings → Webhooks** shows the same. A `400` indicates a signature or metadata validation failure.

### Scheduled job health

Cloud Scheduler records the last run time and result for each job. Check **Cloud Console → Cloud Scheduler** after each expected run window:

| Job | Expected run | Alert if missed |
| --- | --- | --- |
| `refundExpiredMessages` | Daily 2–3 AM UTC | Credits not refunded for expired messages |
| `cleanupOldData` | Sundays 2–3 AM UTC | Storage growth, stale records accumulating |

---

## Deployment Runbook

Complete this sequence for a full production release:

```bash
# 1. Build and deploy shared lib if changed
cd job-portal-shared-lib && npm run build

# 2. Build and deploy Cloud Functions
cd job-portal-backend/functions && npm run build
cd ../../job-portal-config && firebase deploy --only functions

# 3. Deploy rules and indexes if changed
firebase deploy --only firestore:rules,firestore:indexes,storage

# 4. Deploy web
cd ../job-portal-web && vercel --prod

# 5. Confirm scheduled jobs are running
open https://console.cloud.google.com/cloudscheduler

# 6. Tail logs for 5 minutes post-deploy
firebase functions:log --only stripeWebhook,fitScore,sendMessage
```

Mobile releases follow their own cadence (App Store / Play Store review cycles) and are independent of the backend release.
