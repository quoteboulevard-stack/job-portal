import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail = require('@sendgrid/mail');
import { getFirestore } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import { COLLECTIONS, TIMEOUTS } from '../shared/constants';
import type { MessageDocument, NotificationDocument, UserProfile } from './types';

sgMail.setApiKey(config.SENDGRID_KEY);

const FROM_EMAIL = process.env['SENDGRID_FROM_EMAIL'] ?? '';
const FROM_NAME  = process.env['SENDGRID_FROM_NAME']  ?? 'Your App';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[sendMessage] ${msg}`, data ?? {});

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_BODY_LENGTH = 2000;

// ─── Validation ───────────────────────────────────────────────────────────────

async function validateParticipants(
  db: FirebaseFirestore.Firestore,
  fromUserId: string,
  toUserId: string
): Promise<{ sender: UserProfile; receiver: UserProfile }> {
  const [fromSnap, toSnap] = await Promise.all([
    db.collection(COLLECTIONS.USERS).doc(fromUserId).get(),
    db.collection(COLLECTIONS.USERS).doc(toUserId).get(),
  ]);

  if (!fromSnap.exists) throw new Error(`Sender not found: ${fromUserId}`);
  if (!toSnap.exists) throw new Error(`Recipient not found: ${toUserId}`);

  const sender = fromSnap.data() as UserProfile;
  const receiver = toSnap.data() as UserProfile;

  if (sender.role !== 'job_seeker') {
    throw new functions.https.HttpsError('permission-denied', 'Only job seekers can send messages.');
  }
  if (receiver.role !== 'employer') {
    throw new functions.https.HttpsError('permission-denied', 'Messages can only be sent to employers.');
  }

  return { sender, receiver };
}

// ─── Email ────────────────────────────────────────────────────────────────────

async function notifyEmployerByEmail(
  toEmail: string,
  employerName: string,
  senderName: string,
  messageId: string
): Promise<void> {
  await sgMail.send({
    to: toEmail,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: `New message request from ${senderName}`,
    text:
      `Hi ${employerName},\n\n` +
      `You have a new message request from ${senderName}.\n\n` +
      `Message ID: ${messageId}\n` +
      'Log in to your inbox to view and respond.\n\n' +
      'This message will expire in 7 days if not viewed.\n\n' +
      'The Team',
  });
}

// ─── Cloud Function ───────────────────────────────────────────────────────────

export const sendMessage = functions
  .runWith({ timeoutSeconds: TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
  .firestore.document('messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { messageId } = context.params;
    const data = snap.data() as Partial<MessageDocument>;
    const { fromUserId, toUserId, body } = data;
    const db = getFirestore();
    const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

    const fail = async (msg: string) => {
      functions.logger.error(`[sendMessage] Validation failed: ${msg}`, { messageId });
      await snap.ref.update({ status: 'invalid', error: msg, updatedAt: serverTs });
    };

    if (!fromUserId || !toUserId) return fail('Missing fromUserId or toUserId.');
    if (!body?.trim()) return fail('Message body cannot be empty.');
    if (body.trim().length > MAX_BODY_LENGTH) return fail(`Message exceeds ${MAX_BODY_LENGTH} characters.`);
    if (fromUserId === toUserId) return fail('Sender and recipient cannot be the same user.');

    let sender: UserProfile;
    let receiver: UserProfile;
    try {
      ({ sender, receiver } = await validateParticipants(db, fromUserId, toUserId));
    } catch (err: unknown) {
      return fail(err instanceof Error ? err.message : 'Participant validation failed.');
    }

    log('Validated participants', { messageId, fromUserId, toUserId });

    const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + SEVEN_DAYS_MS);

    const notification: NotificationDocument = {
      type: 'new_message',
      messageId,
      fromUserId,
      fromName: sender.displayName,
      toUserId: toUserId!,
      read: false,
      createdAt: serverTs,
    };

    await Promise.all([
      snap.ref.update({
        status: 'sent',
        expiresAt,
        createdAt: serverTs,
        creditDeducted: false,
        creditRefunded: false,
      } satisfies Partial<MessageDocument>),
      db.collection(COLLECTIONS.NOTIFICATIONS).add(notification),
    ]);

    log('Message sent and notification created', { messageId });

    try {
      await notifyEmployerByEmail(receiver.email, receiver.displayName, sender.displayName, messageId);
      log('Email sent to employer', { toUserId, email: receiver.email });
    } catch (err: unknown) {
      // Email failure must not roll back the message — log and continue
      functions.logger.warn('[sendMessage] Email delivery failed', {
        messageId,
        error: err instanceof Error ? err.message : err,
      });
    }

    return { success: true, messageId, timestamp: serverTs };
  });
