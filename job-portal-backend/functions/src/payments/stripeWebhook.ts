import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail = require('@sendgrid/mail');
import Stripe from 'stripe';
import { getFirestore } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import type { PaymentMetadata, PurchaseTransaction, ReceiptEmailData } from './types';
import type { UserCredits } from '../credits/types';
import type { UserProfile } from '../messaging/types';

const stripe = new Stripe(config.STRIPE_SECRET, { apiVersion: '2024-06-20' });
sgMail.setApiKey(config.SENDGRID_KEY);

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const FROM_EMAIL     = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME      = process.env['SENDGRID_FROM_NAME']  ?? 'Your App';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[stripeWebhook] ${msg}`, data ?? {});

// ─── Receipt email ────────────────────────────────────────────────────────────

async function sendReceipt(d: ReceiptEmailData): Promise<void> {
  const amount = (d.amountPaid / 100).toFixed(2);
  const currency = d.currency.toUpperCase();
  await sgMail.send({
    to: d.toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `Receipt — ${d.credits} credits added to your account`,
    text:
      `Hi ${d.displayName},\n\n` +
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

async function fulfillCredits(
  paymentIntentId: string,
  meta: PaymentMetadata,
  amountPaid: number,
  currency: string
): Promise<void> {
  const credits = parseInt(meta.credits, 10);
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new Error(`Invalid credits value in metadata: "${meta.credits}"`);
  }

  const db = getFirestore();
  const userRef = db.collection('users').doc(meta.userId);
  const txLogRef = userRef.collection('credit_transactions').doc();
  const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

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
    if (!userSnap.exists) throw new Error(`User not found: ${meta.userId}`);

    const { balance = 0, totalAdded = 0 } = (userSnap.data() ?? {}) as UserCredits;
    const newBalance = balance + credits;
    const newTotalAdded = totalAdded + credits;

    const transaction: PurchaseTransaction = {
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
  const user = userSnap.data() as UserProfile & { email?: string };
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

export const stripeWebhook = functions
  .runWith({ timeoutSeconds: 30, memory: '256MB' })
  .https.onRequest(async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const sig = req.headers['stripe-signature'] as string | undefined;
    if (!sig) {
      functions.logger.warn('[stripeWebhook] Missing stripe-signature header');
      res.status(400).send('Missing stripe-signature header');
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET);
    } catch (err: unknown) {
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

    const intent = event.data.object as Stripe.PaymentIntent;
    const meta = intent.metadata as Partial<PaymentMetadata>;

    if (!meta.userId || !meta.credits || !meta.plan) {
      functions.logger.error('[stripeWebhook] Missing required metadata', { intentId: intent.id, meta });
      res.status(200).send('OK — metadata incomplete, event skipped');
      return;
    }

    try {
      await fulfillCredits(intent.id, meta as PaymentMetadata, intent.amount, intent.currency);
    } catch (err: unknown) {
      functions.logger.error('[stripeWebhook] Fulfillment failed', {
        intentId: intent.id, error: err instanceof Error ? err.message : err,
      });
      res.status(500).send('Fulfillment error');
      return;
    }

    res.status(200).send('OK');
  });
