import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import sgMail = require('@sendgrid/mail');
import { getFirestore } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import type { PlanType, RazorpayTransaction, RazorpayWebhookPayload } from './types';
import type { UserCredits } from '../credits/types';
import type { UserProfile } from '../messaging/types';

sgMail.setApiKey(config.SENDGRID_KEY);

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? '';
const FROM_EMAIL     = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME      = process.env['SENDGRID_FROM_NAME']  ?? 'Your App';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[razorpayWebhook] ${msg}`, data ?? {});

// ─── Signature verification ───────────────────────────────────────────────────

function verifySignature(rawBody: Buffer, signature: string): boolean {
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  // timingSafeEqual requires same-length buffers
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ─── Receipt email ────────────────────────────────────────────────────────────

async function sendReceipt(
  toEmail: string,
  displayName: string,
  credits: number,
  amountPaise: number,
  currency: string,
  paymentId: string
): Promise<void> {
  const amount = (amountPaise / 100).toFixed(2);
  await sgMail.send({
    to: toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Receipt — ${credits} credits added to your account`,
    text:
      `Hi ${displayName},\n\n` +
      `Thank you for your purchase!\n\n` +
      `Credits added: ${credits}\n` +
      `Amount charged: ${currency.toUpperCase()} ${amount}\n` +
      `Payment ID: ${paymentId}\n\n` +
      'Your credits are now available in your account.\n\n' +
      'The Team',
  });
}

// ─── Credit fulfillment ───────────────────────────────────────────────────────

async function fulfillCredits(
  paymentId: string,
  userId: string,
  credits: number,
  plan: PlanType | 'unknown',
  amountPaid: number,
  currency: string
): Promise<void> {
  const db = getFirestore();
  const userRef = db.collection('users').doc(userId);
  const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

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
    if (!userSnap.exists) throw new Error(`User not found: ${userId}`);

    const { balance = 0, totalAdded = 0 } = (userSnap.data() ?? {}) as UserCredits;
    const newBalance = balance + credits;
    const newTotalAdded = totalAdded + credits;

    const transaction: RazorpayTransaction = {
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
  const user = userSnap.data() as UserProfile & { email?: string };
  if (user?.email) {
    await sendReceipt(user.email, user.displayName ?? 'there', credits, amountPaid, currency, paymentId);
    log('Receipt sent', { userId, email: user.email });
  }
}

// ─── HTTP handler ─────────────────────────────────────────────────────────────

export const razorpayWebhook = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

    const signature = req.headers['x-razorpay-signature'] as string | undefined;
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

    const body = req.body as RazorpayWebhookPayload;
    log('Event received', { event: body.event });

    if (body.event !== 'payment.captured') { res.status(200).send('Event ignored'); return; }

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
    } catch (err: unknown) {
      functions.logger.error('[razorpayWebhook] Fulfillment failed', {
        paymentId: payment?.id, error: err instanceof Error ? err.message : err,
      });
      res.status(500).send('Fulfillment error');
      return;
    }

    res.status(200).send('OK');
  });
