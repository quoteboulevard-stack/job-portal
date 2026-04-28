import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getFirestore } from '../shared/firebaseAdmin';
import { COLLECTIONS } from '../shared/constants';
import type { FCMTokenRecord, PushNotificationType } from './types';

const log = (msg: string, data?: object) =>
  functions.logger.info(`[pushNotification] ${msg}`, data ?? {});

// Token errors that mean the token is permanently invalid — no point retrying
const STALE_TOKEN_ERRORS = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/mismatched-credential',
]);

// ─── Token management ─────────────────────────────────────────────────────────

async function getFcmToken(userId: string): Promise<string | null> {
  const snap = await getFirestore().collection(COLLECTIONS.USERS).doc(userId).get();
  if (!snap.exists) return null;
  const { fcmToken } = (snap.data() ?? {}) as Partial<FCMTokenRecord>;
  return fcmToken ?? null;
}

async function clearStaleToken(userId: string): Promise<void> {
  await getFirestore()
    .collection(COLLECTIONS.USERS)
    .doc(userId)
    .update({ fcmToken: admin.firestore.FieldValue.delete() });
  log('Stale FCM token cleared', { userId });
}

// ─── Send ─────────────────────────────────────────────────────────────────────

export async function sendPushNotification(
  userId: string,
  type: PushNotificationType,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: boolean; reason?: string }> {
  if (!userId || !title || !body) {
    throw new Error('sendPushNotification: userId, title, and body are required.');
  }

  const token = await getFcmToken(userId);

  if (!token) {
    log('No FCM token — user offline or not registered', { userId, type });
    return { sent: false, reason: 'no_token' };
  }

  const message: admin.messaging.Message = {
    token,
    notification: { title, body },
    data: { type, ...(data ?? {}) },
    android: {
      priority: 'high',
      notification: { sound: 'default', channelId: type },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  try {
    const messageId = await admin.messaging().send(message);
    log('Push sent', { userId, type, messageId });
    return { sent: true };
  } catch (err: unknown) {
    const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code ?? '';

    if (STALE_TOKEN_ERRORS.has(code)) {
      log('Stale token detected', { userId, code });
      await clearStaleToken(userId);
      return { sent: false, reason: 'stale_token' };
    }

    // Transient errors (quota, server unavailable) — log and return; caller decides on retry
    functions.logger.error('[pushNotification] FCM send failed', {
      userId, type, code, error: err instanceof Error ? err.message : err,
    });
    return { sent: false, reason: code || 'fcm_error' };
  }
}

// ─── Batch send ───────────────────────────────────────────────────────────────

export async function sendPushNotificationToMany(
  userIds: string[],
  type: PushNotificationType,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ userId: string; sent: boolean; reason?: string }[]> {
  const results = await Promise.allSettled(
    userIds.map((uid) => sendPushNotification(uid, type, title, body, data))
  );

  return results.map((result, i) => ({
    userId: userIds[i]!,
    sent: result.status === 'fulfilled' ? result.value.sent : false,
    reason: result.status === 'rejected'
      ? (result.reason instanceof Error ? result.reason.message : 'unknown')
      : (result.status === 'fulfilled' ? result.value.reason : undefined),
  }));
}
