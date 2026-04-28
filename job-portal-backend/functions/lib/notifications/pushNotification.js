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
exports.sendPushNotification = sendPushNotification;
exports.sendPushNotificationToMany = sendPushNotificationToMany;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const constants_1 = require("../shared/constants");
const log = (msg, data) => functions.logger.info(`[pushNotification] ${msg}`, data ?? {});
// Token errors that mean the token is permanently invalid — no point retrying
const STALE_TOKEN_ERRORS = new Set([
    'messaging/registration-token-not-registered',
    'messaging/invalid-registration-token',
    'messaging/mismatched-credential',
]);
// ─── Token management ─────────────────────────────────────────────────────────
async function getFcmToken(userId) {
    const snap = await (0, firebaseAdmin_1.getFirestore)().collection(constants_1.COLLECTIONS.USERS).doc(userId).get();
    if (!snap.exists)
        return null;
    const { fcmToken } = (snap.data() ?? {});
    return fcmToken ?? null;
}
async function clearStaleToken(userId) {
    await (0, firebaseAdmin_1.getFirestore)()
        .collection(constants_1.COLLECTIONS.USERS)
        .doc(userId)
        .update({ fcmToken: admin.firestore.FieldValue.delete() });
    log('Stale FCM token cleared', { userId });
}
// ─── Send ─────────────────────────────────────────────────────────────────────
async function sendPushNotification(userId, type, title, body, data) {
    if (!userId || !title || !body) {
        throw new Error('sendPushNotification: userId, title, and body are required.');
    }
    const token = await getFcmToken(userId);
    if (!token) {
        log('No FCM token — user offline or not registered', { userId, type });
        return { sent: false, reason: 'no_token' };
    }
    const message = {
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
    }
    catch (err) {
        const code = err?.errorInfo?.code ?? '';
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
async function sendPushNotificationToMany(userIds, type, title, body, data) {
    const results = await Promise.allSettled(userIds.map((uid) => sendPushNotification(uid, type, title, body, data)));
    return results.map((result, i) => ({
        userId: userIds[i],
        sent: result.status === 'fulfilled' ? result.value.sent : false,
        reason: result.status === 'rejected'
            ? (result.reason instanceof Error ? result.reason.message : 'unknown')
            : (result.status === 'fulfilled' ? result.value.reason : undefined),
    }));
}
//# sourceMappingURL=pushNotification.js.map