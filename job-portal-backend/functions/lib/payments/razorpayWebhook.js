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
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const sgMail = require("@sendgrid/mail");
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const validateEnv_1 = require("../shared/validateEnv");
sgMail.setApiKey(validateEnv_1.config.SENDGRID_KEY);
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME = process.env['SENDGRID_FROM_NAME'] ?? 'Your App';
const log = (msg, data) => functions.logger.info(`[razorpayWebhook] ${msg}`, data ?? {});
// ─── Signature verification ───────────────────────────────────────────────────
function verifySignature(rawBody, signature) {
    const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
    // timingSafeEqual requires same-length buffers
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(signature, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}
// ─── Receipt email ────────────────────────────────────────────────────────────
async function sendReceipt(toEmail, displayName, credits, amountPaise, currency, paymentId) {
    const amount = (amountPaise / 100).toFixed(2);
    await sgMail.send({
        to: toEmail,
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: `Receipt — ${credits} credits added to your account`,
        text: `Hi ${displayName},\n\n` +
            `Thank you for your purchase!\n\n` +
            `Credits added: ${credits}\n` +
            `Amount charged: ${currency.toUpperCase()} ${amount}\n` +
            `Payment ID: ${paymentId}\n\n` +
            'Your credits are now available in your account.\n\n' +
            'The Team',
    });
}
// ─── Credit fulfillment ───────────────────────────────────────────────────────
async function fulfillCredits(paymentId, userId, credits, plan, amountPaid, currency) {
    const db = (0, firebaseAdmin_1.getFirestore)();
    const userRef = db.collection('users').doc(userId);
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    // Idempotency: skip if payment already processed
    const existing = await userRef.collection('credit_transactions')
        .where('razorpayPaymentId', '==', paymentId).limit(1).get();
    if (!existing.empty) {
        log('Duplicate event — already processed', { paymentId, userId });
        return;
    }
    const txLogRef = userRef.collection('credit_transactions').doc();
    await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        if (!userSnap.exists)
            throw new Error(`User not found: ${userId}`);
        const { balance = 0, totalAdded = 0 } = (userSnap.data() ?? {});
        const newBalance = balance + credits;
        const newTotalAdded = totalAdded + credits;
        const transaction = {
            type: 'purchase',
            plan,
            credits,
            amountPaid,
            currency,
            razorpayPaymentId: paymentId,
            date: serverTs,
            balanceAfter: newBalance,
        };
        tx.update(userRef, { balance: newBalance, totalAdded: newTotalAdded, updatedAt: serverTs });
        tx.set(txLogRef, transaction);
    });
    log('Credits fulfilled', { userId, credits, plan });
    const userSnap = await userRef.get();
    const user = userSnap.data();
    if (user?.email) {
        await sendReceipt(user.email, user.displayName ?? 'there', credits, amountPaid, currency, paymentId);
        log('Receipt sent', { userId, email: user.email });
    }
}
// ─── HTTP handler ─────────────────────────────────────────────────────────────
exports.razorpayWebhook = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
        functions.logger.warn('[razorpayWebhook] Missing x-razorpay-signature header');
        res.status(400).send('Missing x-razorpay-signature header');
        return;
    }
    if (!verifySignature(req.rawBody, signature)) {
        functions.logger.warn('[razorpayWebhook] Signature verification failed');
        res.status(400).send('Webhook signature verification failed');
        return;
    }
    const body = req.body;
    log('Event received', { event: body.event });
    if (body.event !== 'payment.captured') {
        res.status(200).send('Event ignored');
        return;
    }
    const payment = body.payload?.payment?.entity;
    const { userId, credits: creditsStr, plan } = payment?.notes ?? {};
    if (!userId || !creditsStr) {
        functions.logger.error('[razorpayWebhook] Missing notes.userId or notes.credits', { paymentId: payment?.id });
        res.status(400).json({ error: 'Payment notes missing required fields: userId, credits' });
        return;
    }
    const credits = parseInt(creditsStr, 10);
    if (!Number.isFinite(credits) || credits <= 0) {
        functions.logger.error('[razorpayWebhook] Invalid credits value', { creditsStr, paymentId: payment?.id });
        res.status(400).json({ error: `Invalid credits value: "${creditsStr}"` });
        return;
    }
    try {
        await fulfillCredits(payment.id, userId, credits, plan ?? 'unknown', payment.amount, payment.currency);
    }
    catch (err) {
        functions.logger.error('[razorpayWebhook] Fulfillment failed', {
            paymentId: payment?.id, error: err instanceof Error ? err.message : err,
        });
        res.status(500).send('Fulfillment error');
        return;
    }
    res.status(200).send('OK');
});
//# sourceMappingURL=razorpayWebhook.js.map