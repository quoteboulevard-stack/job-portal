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
exports.missingSkills = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const validateEnv_1 = require("../shared/validateEnv");
const claude = new sdk_1.default({ apiKey: validateEnv_1.config.CLAUDE_API_KEY });
const log = (msg, data) => functions.logger.info(`[missingSkills] ${msg}`, data ?? {});
// ─── Premium guard ────────────────────────────────────────────────────────────
async function assertPremium(uid) {
    const userRecord = await admin.auth().getUser(uid);
    if (userRecord.customClaims?.['premium'] !== true) {
        throw new functions.https.HttpsError('permission-denied', 'This feature requires a premium subscription.');
    }
}
// ─── Claude analysis ──────────────────────────────────────────────────────────
async function analyzeWithClaude(missingSkills, jobTitle) {
    if (missingSkills.length === 0)
        return [];
    const message = await claude.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: `Analyze these missing skills for a "${jobTitle ?? 'this role'}" position.\n` +
                    'Return ONLY valid JSON — an array, no markdown:\n' +
                    '[{ "skill": string, "learn_time_months": number, "resources": string[], "job_impact": string }]\n\n' +
                    `Missing skills: ${JSON.stringify(missingSkills)}`,
            },
        ],
    });
    const raw = message.content[0].text.trim();
    return JSON.parse(raw);
}
// ─── Callable Function ────────────────────────────────────────────────────────
exports.missingSkills = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const { jobId, applicationId } = data ?? {};
    if (!jobId || !applicationId) {
        throw new functions.https.HttpsError('invalid-argument', 'Both jobId and applicationId are required.');
    }
    const uid = context.auth.uid;
    log('Request received', { uid, applicationId, jobId });
    await assertPremium(uid);
    const db = (0, firebaseAdmin_1.getFirestore)();
    const [appSnap, jdSnap] = await Promise.all([
        db.collection('applications').doc(applicationId).get(),
        db.collection('jobs').doc(jobId).get(),
    ]);
    if (!appSnap.exists) {
        throw new functions.https.HttpsError('not-found', `Application ${applicationId} not found.`);
    }
    const appData = appSnap.data();
    if (appData.status !== 'success' || !appData.missing_skills?.length) {
        throw new functions.https.HttpsError('failed-precondition', 'Fit score must be successfully computed before analyzing missing skills.');
    }
    // Ensure caller owns the application
    const appOwner = appSnap.data()?.['userId'];
    if (appOwner !== uid) {
        throw new functions.https.HttpsError('permission-denied', 'Access denied.');
    }
    const jobTitle = jdSnap.exists ? jdSnap.data()?.['parsed']?.title : null;
    log('Calling Claude', { applicationId, missingCount: appData.missing_skills.length });
    let skill_gaps;
    try {
        skill_gaps = await analyzeWithClaude(appData.missing_skills, jobTitle);
    }
    catch (err) {
        functions.logger.error('[missingSkills] Claude failed', { error: err instanceof Error ? err.message : err });
        throw new functions.https.HttpsError('internal', 'Skill analysis failed. Please try again.');
    }
    const detail = {
        applicationId,
        jobId,
        skill_gaps,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db
        .collection('applications')
        .doc(applicationId)
        .collection('missing_skills_detail')
        .doc('latest')
        .set(detail);
    log('Analysis stored', { applicationId, gaps: skill_gaps.length });
    return { skill_gaps };
});
//# sourceMappingURL=missingSkills.js.map