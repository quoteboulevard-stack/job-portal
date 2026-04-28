"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sgMail = require("@sendgrid/mail");
const stripe_1 = __importDefault(require("stripe"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const validateEnv_1 = require("../shared/validateEnv");
const stripe = new stripe_1.default(validateEnv_1.config.STRIPE_SECRET, { apiVersion: '2024-06-20' });
sgMail.setApiKey(validateEnv_1.config.SENDGRID_KEY);
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME = process.env['SENDGRID_FROM_NAME'] ?? 'Your App';
const log = (msg, data) => functions.logger.info(`[stripeWebhook] ${msg}`, data ?? {});
// ─── Receipt email ────────────────────────────────────────────────────────────
async function sendReceipt(d) {
    const amount = (d.amountPaid / 100).toFixed(2);
    const currency = d.currency.toUpperCase();
    await sgMail.send({
        to: d.toEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `Receipt — ${d.credits} credits added to your account`,
        text: `Hi ${d.displayName},\n\n` +
            `Thank you for your purchase!\n\n` +
            `Plan: ${d.plan}\n` +
            `Credits added: ${d.credits}\n` +
            `Amount charged: ${currency} ${amount}\n` +
            `Payment ID: ${d.paymentIntentId}\n\n` +
            'Your credits are now available in your account.\n\n' +
            'The Team',
    });
}
// ─── Credit fulfillment ───────────────────────────────────────────────────────
async function fulfillCredits(paymentIntentId, meta, amountPaid, currency) {
    const credits = parseInt(meta.credits, 10);
    if (!Number.isFinite(credits) || credits <= 0) {
        throw new Error(`Invalid credits value in metadata: "${meta.credits}"`);
    }
    const db = (0, firebaseAdmin_1.getFirestore)();
    const userRef = db.collection('users').doc(meta.userId);
    const txLogRef = userRef.collection('credit_transactions').doc();
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    // Idempotency: abort if this payment intent was already processed
    const existingSnap = await db
        .collection('users').doc(meta.userId)
        .collection('credit_transactions')
        .where('stripePaymentIntentId', '==', paymentIntentId)
        .limit(1)
        .get();
    if (!existingSnap.empty) {
        log('Duplicate event — already processed', { paymentIntentId, userId: meta.userId });
        return;
    }
    await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists)
            throw new Error(`User not found: ${meta.userId}`);
        const { balance = 0, totalAdded = 0 } = (userSnap.data() ?? {});
        const newBalance = balance + credits;
        const newTotalAdded = totalAdded + credits;
        const transaction = {
            type: 'purchase',
            plan: meta.plan,
            credits,
            amountPaid,
            currency,
            stripePaymentIntentId: paymentIntentId,
            date: serverTs,
            balanceAfter: newBalance,
        };
        tx.update(userRef, { balance: newBalance, totalAdded: newTotalAdded, updatedAt: serverTs });
        tx.set(txLogRef, transaction);
    });
    log('Credits fulfilled', { userId: meta.userId, credits, plan: meta.plan });
    const userSnap = await userRef.get();
    const user = userSnap.data();
    if (user?.email) {
        await sendReceipt({
            toEmail: user.email,
            displayName: user.displayName ?? 'there',
            credits,
            amountPaid,
            currency,
            plan: meta.plan,
            paymentIntentId,
        });
        log('Receipt sent', { userId: meta.userId, email: user.email });
    }
}
// ─── HTTP handler ─────────────────────────────────────────────────────────────
exports.stripeWebhook = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        functions.logger.warn('[stripeWebhook] Missing stripe-signature header');
        res.status(400).send('Missing stripe-signature header');
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);
    }
    catch (err) {
        functions.logger.warn('[stripeWebhook] Signature verification failed', {
            error: err instanceof Error ? err.message : err,
        });
        res.status(400).send('Webhook signature verification failed');
        return;
    }
    log('Event received', { type: event.type, id: event.id });
    if (event.type !== 'payment_intent.succeeded') {
        res.status(200).send('Event ignored');
        return;
    }
    const intent = event.data.object;
    const meta = intent.metadata;
    if (!meta.userId || !meta.credits || !meta.plan) {
        functions.logger.error('[stripeWebhook] Missing required metadata', { intentId: intent.id, meta });
        res.status(200).send('OK — metadata incomplete, event skipped');
        return;
    }
    try {
        await fulfillCredits(intent.id, meta, intent.amount, intent.currency);
    }
    catch (err) {
        functions.logger.error('[stripeWebhook] Fulfillment failed', {
            intentId: intent.id, error: err instanceof Error ? err.message : err,
        });
        res.status(500).send('Fulfillment error');
        return;
    }
    res.status(200).send('OK');
});
//# sourceMappingURL=stripeWebhook.js.map