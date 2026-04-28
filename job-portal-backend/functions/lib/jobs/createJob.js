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
exports.createJob = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const constants_1 = require("../shared/constants");
const VALID_WORK_MODES = ['remote', 'hybrid', 'onsite'];
const VALID_EMPLOYMENT_TYPES = ['fulltime', 'parttime', 'contract', 'internship', 'freelance'];
const VALID_EXPERIENCES = ['entry', 'mid', 'senior'];
const MAX_DESCRIPTION = 10000;
const MAX_LIST_ITEMS = 50;
const MAX_ITEM_LENGTH = 200;
const log = (msg, data) => functions.logger.info(`[createJob] ${msg}`, data ?? {});
function requireString(value, field, max = 500) {
    const s = String(value ?? '').trim();
    if (!s)
        throw new functions.https.HttpsError('invalid-argument', `${field} is required.`);
    if (s.length > max)
        throw new functions.https.HttpsError('invalid-argument', `${field} must be <= ${max} characters.`);
    return s;
}
function sanitiseList(value, field) {
    if (!Array.isArray(value))
        return [];
    if (value.length > MAX_LIST_ITEMS) {
        throw new functions.https.HttpsError('invalid-argument', `${field} must have <= ${MAX_LIST_ITEMS} items.`);
    }
    return value
        .map((item) => String(item ?? '').trim())
        .filter(Boolean)
        .map((item) => {
        if (item.length > MAX_ITEM_LENGTH) {
            throw new functions.https.HttpsError('invalid-argument', `Each item in ${field} must be <= ${MAX_ITEM_LENGTH} characters.`);
        }
        return item;
    });
}
exports.createJob = functions
    .runWith({ timeoutSeconds: constants_1.TIMEOUTS.DEFAULT_REQUEST / 1000, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const uid = context.auth.uid;
    const db = (0, firebaseAdmin_1.getFirestore)();
    const callerSnap = await db.collection(constants_1.COLLECTIONS.USERS).doc(uid).get();
    if (!callerSnap.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
    }
    const caller = callerSnap.data();
    if (caller['role'] !== 'employer') {
        throw new functions.https.HttpsError('permission-denied', 'Only employers can post jobs.');
    }
    const title = requireString(data?.title, 'title');
    const company = requireString(data?.company, 'company');
    const location = requireString(data?.location, 'location');
    const description = requireString(data?.description, 'description', MAX_DESCRIPTION);
    const workMode = String(data?.workMode ?? '').trim();
    if (!VALID_WORK_MODES.includes(workMode)) {
        throw new functions.https.HttpsError('invalid-argument', `workMode must be one of: ${VALID_WORK_MODES.join(', ')}.`);
    }
    const employmentType = String(data?.employmentType ?? '').trim();
    if (!VALID_EMPLOYMENT_TYPES.includes(employmentType)) {
        throw new functions.https.HttpsError('invalid-argument', `employmentType must be one of: ${VALID_EMPLOYMENT_TYPES.join(', ')}.`);
    }
    const experience = String(data?.experience ?? 'entry').trim();
    if (!VALID_EXPERIENCES.includes(experience)) {
        throw new functions.https.HttpsError('invalid-argument', `experience must be one of: ${VALID_EXPERIENCES.join(', ')}.`);
    }
    const salary = typeof data?.salary === 'number' && Number.isFinite(data.salary) && data.salary > 0
        ? Math.round(data.salary)
        : null;
    const requirements = sanitiseList(data?.requirements, 'requirements');
    const skills = sanitiseList(data?.skills, 'skills');
    const perks = sanitiseList(data?.perks, 'perks');
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    const jobRef = await db.collection(constants_1.COLLECTIONS.JOBS).add({
        title,
        company,
        location,
        workMode,
        employmentType,
        experience,
        description,
        salary,
        requirements,
        skills,
        perks,
        employerId: uid,
        status: 'open',
        createdAt: serverTs,
        updatedAt: serverTs,
    });
    log('Job created', { jobId: jobRef.id, uid });
    return { success: true, jobId: jobRef.id };
});
//# sourceMappingURL=createJob.js.map