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
exports.updateApplicationStatus = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const constants_1 = require("../shared/constants");
const pushNotification_1 = require("../notifications/pushNotification");
const VALID_STATUSES = ['applied', 'shortlisted', 'interview', 'offer', 'rejected'];
const log = (msg, data) => functions.logger.info(`[updateApplicationStatus] ${msg}`, data ?? {});
exports.updateApplicationStatus = functions
    .runWith({ timeoutSeconds: constants_1.TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = context.auth.uid;
    const applicationId = String(data?.applicationId ?? '').trim();
    const status = String(data?.status ?? '').trim();
    if (!applicationId) {
        throw new functions.https.HttpsError('invalid-argument', 'applicationId is required.');
    }
    if (!VALID_STATUSES.includes(status)) {
        throw new functions.https.HttpsError('invalid-argument', `status must be one of: ${VALID_STATUSES.join(', ')}.`);
    }
    const db = (0, firebaseAdmin_1.getFirestore)();
    const callerSnap = await db.collection(constants_1.COLLECTIONS.USERS).doc(uid).get();
    if (!callerSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const caller = callerSnap.data();
    if (caller['role'] !== 'employer') {
        throw new functions.https.HttpsError('permission-denied', 'Only employers can update application status.');
    }
    const appSnap = await db.collection(constants_1.COLLECTIONS.APPLICATIONS).doc(applicationId).get();
    if (!appSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Application not found.');
    }
    const appData = appSnap.data();
    if (appData['employerId'] !== uid) {
        throw new functions.https.HttpsError('permission-denied', 'You are not the employer for this application.');
    }
    await appSnap.ref.update({
        status: status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    log('Status updated', { applicationId, status });
    const applicantId = String(appData['applicantId'] ?? appData['userId'] ?? '');
    const jobTitle = String(appData['jobTitle'] ?? 'the position');
    if (applicantId) {
        const pushTitle = status === 'offer' ? 'Congratulations! Job Offer' : 'Application Update';
        const pushBody = `Your application for "${jobTitle}" has been updated to: ${status}`;
        (0, pushNotification_1.sendPushNotification)(applicantId, 'job_matched', pushTitle, pushBody, { applicationId, status }).catch((err) => {
            functions.logger.warn('[updateApplicationStatus] Push notification failed', {
                applicantId,
                error: err instanceof Error ? err.message : err,
            });
        });
    }
    return { success: true, applicationId, status };
});
//# sourceMappingURL=updateApplicationStatus.js.map