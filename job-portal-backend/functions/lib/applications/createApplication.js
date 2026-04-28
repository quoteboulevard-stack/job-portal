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
exports.createApplication = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const constants_1 = require("../shared/constants");
const pushNotification_1 = require("../notifications/pushNotification");
const log = (msg, data) => functions.logger.info(`[createApplication] ${msg}`, data ?? {});
exports.createApplication = functions
    .runWith({ timeoutSeconds: constants_1.TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = context.auth.uid;
    const jobId = String(data?.jobId ?? '').trim();
    const jobTitle = String(data?.jobTitle ?? '').trim();
    const company = String(data?.company ?? '').trim();
    const employerId = String(data?.employerId ?? '').trim();
    if (!jobId)
        throw new functions.https.HttpsError('invalid-argument', 'jobId is required.');
    if (!jobTitle)
        throw new functions.https.HttpsError('invalid-argument', 'jobTitle is required.');
    if (!company)
        throw new functions.https.HttpsError('invalid-argument', 'company is required.');
    if (!employerId)
        throw new functions.https.HttpsError('invalid-argument', 'employerId is required.');
    if (uid === employerId) {
        throw new functions.https.HttpsError('invalid-argument', 'Employers cannot apply to their own jobs.');
    }
    const db = (0, firebaseAdmin_1.getFirestore)();
    const callerSnap = await db.collection(constants_1.COLLECTIONS.USERS).doc(uid).get();
    if (!callerSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const caller = callerSnap.data();
    if (caller['role'] !== 'job_seeker') {
        throw new functions.https.HttpsError('permission-denied', 'Only job seekers can apply to jobs.');
    }
    const applicationId = `${uid}_${jobId}`;
    const existingSnap = await db.collection(constants_1.COLLECTIONS.APPLICATIONS).doc(applicationId).get();
    if (existingSnap.exists) {
        throw new functions.https.HttpsError('already-exists', 'You have already applied to this job.');
    }
    const jobSnap = await db.collection(constants_1.COLLECTIONS.JOBS).doc(jobId).get();
    if (!jobSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'Job not found.');
    }
    const applicantName = String(caller['displayName'] ?? context.auth.token.name ?? '');
    const applicantEmail = String(caller['email'] ?? context.auth.token.email ?? '');
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    await db.collection(constants_1.COLLECTIONS.APPLICATIONS).doc(applicationId).set({
        jobId,
        jobTitle,
        company,
        employerId,
        applicantId: uid,
        userId: uid,
        applicantName,
        applicantEmail,
        status: 'applied',
        appliedAt: serverTs,
        updatedAt: serverTs,
    });
    log('Application created', { applicationId, jobId, uid });
    // Fire-and-forget push — the Firestore onCreate trigger will compute fit score
    (0, pushNotification_1.sendPushNotification)(employerId, 'job_matched', 'New application received', `${applicantName || 'A job seeker'} applied for "${jobTitle}"`, { applicationId, jobId }).catch((err) => {
        functions.logger.warn('[createApplication] Push notification failed', {
            employerId,
            error: err instanceof Error ? err.message : err,
        });
    });
    return { success: true, applicationId };
});
//# sourceMappingURL=createApplication.js.map