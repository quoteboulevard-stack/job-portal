"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
// Vars always required — even in emulator mode
const ALWAYS_REQUIRED = ['FIREBASE_PROJECT_ID'];
// Vars only required in production.
// When FIRESTORE_EMULATOR_HOST is set, external services (Claude, Stripe,
// SendGrid) are mocked or bypassed, so their keys are not needed.
const PROD_ONLY_REQUIRED = [
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
    'CLAUDE_API_KEY',
    'STRIPE_SECRET',
    'STRIPE_WEBHOOK_SECRET',
    'RAZORPAY_WEBHOOK_SECRET',
    'SENDGRID_KEY',
    'SENDGRID_FROM_EMAIL',
];
const REQUIRED = [...ALWAYS_REQUIRED, ...PROD_ONLY_REQUIRED];
const OPTIONAL = {
    FIREBASE_STORAGE_BUCKET: '',
    NODE_ENV: 'production',
    PORT: '8080',
    LOG_LEVEL: 'info',
};
function isBlank(value) {
    const v = value?.trim();
    return !v || v === 'undefined' || v === 'null';
}
function validate() {
    // The Firebase emulator injects GCLOUD_PROJECT from the --project flag.
    // Backfill FIREBASE_PROJECT_ID so functions don't need a manual .env file.
    if (!process.env.FIREBASE_PROJECT_ID && process.env.GCLOUD_PROJECT) {
        process.env.FIREBASE_PROJECT_ID = process.env.GCLOUD_PROJECT;
    }
    const isEmulator = !isBlank(process.env.FIRESTORE_EMULATOR_HOST) ||
        !isBlank(process.env.GCLOUD_PROJECT);
    // In emulator mode, only FIREBASE_PROJECT_ID is truly required.
    const keysToValidate = isEmulator
        ? [...ALWAYS_REQUIRED]
        : [...ALWAYS_REQUIRED, ...PROD_ONLY_REQUIRED];
    const missing = keysToValidate.filter((key) => isBlank(process.env[key]));
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
            'See .env.example for all required variables.');
    }
    // Use 'emulator' as a safe placeholder for missing prod-only vars in emulator mode.
    const required = Object.fromEntries(REQUIRED.map((key) => [key, process.env[key]?.trim() || 'emulator']));
    const optional = Object.fromEntries(Object.keys(OPTIONAL).map((key) => [
        key,
        process.env[key]?.trim() || OPTIONAL[key],
    ]));
    return { ...required, ...optional };
}
exports.config = validate();
//# sourceMappingURL=validateEnv.js.map