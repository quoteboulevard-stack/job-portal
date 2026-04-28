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
exports.listAdminCreditTransactions = exports.deleteAdminMessage = exports.listAdminMessages = exports.deleteAdminApplication = exports.listAdminApplications = exports.deleteAdminJob = exports.listAdminJobs = exports.listAdminUsers = exports.getAdminStats = void 0;
const functions = __importStar(require("firebase-functions"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
function formatTimestamp(value) {
    const raw = value;
    if (raw?.toDate) {
        return raw.toDate().toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    }
    return '—';
}
async function assertAdmin(context) {
    const uid = context.auth?.uid;
    if (!uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const callerSnap = await (0, firebaseAdmin_1.getFirestore)().collection('users').doc(uid).get();
    if (callerSnap.data()?.['role'] !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
    }
}
exports.getAdminStats = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onCall(async (_data, context) => {
    await assertAdmin(context);
    const db = (0, firebaseAdmin_1.getFirestore)();
    const [users, jobs, applications, messages] = await Promise.all([
        db.collection('users').get(),
        db.collection('jobs').get(),
        db.collection('applications').get(),
        db.collection('messages').get(),
    ]);
    return {
        totalUsers: users.size,
        totalJobs: jobs.size,
        totalApplications: applications.size,
        totalMessages: messages.size,
    };
});
exports.listAdminUsers = functions
    .runWith({ timeoutSeconds: 60, memory: '256MB' })
    .https.onCall(async (_data, context) => {
    await assertAdmin(context);
    const snap = await (0, firebaseAdmin_1.getFirestore)().collection('users').get();
    return snap.docs.map((userDoc) => {
        const d = userDoc.data();
        return {
            uid: userDoc.id,
            email: String(d['email'] ?? ''),
            name: String(d['displayName'] ?? d['name'] ?? ''),
            role: String(d['role'] ?? 'job_seeker'),
            location: String(d['location'] ?? ''),
            balance: typeof d['balance'] === 'number' ? d['balance'] : 0,
            createdAt: formatTimestamp(d['createdAt']),
        };
    });
});
exports.listAdminJobs = functions
    .runWith({ timeoutSeconds: 60, memory: '256MB' })
    .https.onCall(async (_data, context) => {
    await assertAdmin(context);
    const snap = await (0, firebaseAdmin_1.getFirestore)().collection('jobs').get();
    return snap.docs.map((jobDoc) => {
        const d = jobDoc.data();
        return {
            id: jobDoc.id,
            title: String(d['title'] ?? 'Untitled'),
            company: String(d['company'] ?? ''),
            location: String(d['location'] ?? ''),
            employerId: String(d['employerId'] ?? ''),
            status: String(d['status'] ?? 'open'),
            createdAt: formatTimestamp(d['createdAt']),
        };
    });
});
exports.deleteAdminJob = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onCall(async (data, context) => {
    await assertAdmin(context);
    const jobId = String(data?.jobId ?? '').trim();
    if (!jobId) {
        throw new functions.https.HttpsError('invalid-argument', 'jobId is required.');
    }
    await (0, firebaseAdmin_1.getFirestore)().collection('jobs').doc(jobId).delete();
    return { success: true };
});
exports.listAdminApplications = functions
    .runWith({ timeoutSeconds: 60, memory: '256MB' })
    .https.onCall(async (_data, context) => {
    await assertAdmin(context);
    const snap = await (0, firebaseAdmin_1.getFirestore)().collection('applications').get();
    return snap.docs.map((applicationDoc) => {
        const d = applicationDoc.data();
        return {
            id: applicationDoc.id,
            jobTitle: String(d['jobTitle'] ?? 'Unknown role'),
            company: String(d['company'] ?? ''),
            applicantName: String(d['applicantName'] ?? ''),
            applicantEmail: String(d['applicantEmail'] ?? ''),
            employerId: String(d['employerId'] ?? ''),
            status: String(d['status'] ?? 'applied'),
            fitScore: typeof d['fitScore'] === 'number' ? d['fitScore'] : null,
            appliedAt: formatTimestamp(d['appliedAt'] ?? d['createdAt']),
        };
    });
});
exports.deleteAdminApplication = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onCall(async (data, context) => {
    await assertAdmin(context);
    const applicationId = String(data?.applicationId ?? '').trim();
    if (!applicationId) {
        throw new functions.https.HttpsError('invalid-argument', 'applicationId is required.');
    }
    await (0, firebaseAdmin_1.getFirestore)().collection('applications').doc(applicationId).delete();
    return { success: true };
});
exports.listAdminMessages = functions
    .runWith({ timeoutSeconds: 60, memory: '256MB' })
    .https.onCall(async (_data, context) => {
    await assertAdmin(context);
    const snap = await (0, firebaseAdmin_1.getFirestore)().collection('messages').get();
    return snap.docs.map((messageDoc) => {
        const d = messageDoc.data();
        return {
            id: messageDoc.id,
            fromName: String(d['fromName'] ?? ''),
            toName: String(d['toName'] ?? ''),
            subject: String(d['subject'] ?? d['jobTitle'] ?? ''),
            body: String(d['body'] ?? d['text'] ?? ''),
            status: String(d['status'] ?? 'sent'),
            creditCost: typeof d['creditCost'] === 'number' ? d['creditCost'] : 1,
            createdAt: formatTimestamp(d['createdAt']),
        };
    });
});
exports.deleteAdminMessage = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onCall(async (data, context) => {
    await assertAdmin(context);
    const messageId = String(data?.messageId ?? '').trim();
    if (!messageId) {
        throw new functions.https.HttpsError('invalid-argument', 'messageId is required.');
    }
    await (0, firebaseAdmin_1.getFirestore)().collection('messages').doc(messageId).delete();
    return { success: true };
});
exports.listAdminCreditTransactions = functions
    .runWith({ timeoutSeconds: 60, memory: '256MB' })
    .https.onCall(async (_data, context) => {
    await assertAdmin(context);
    const snap = await (0, firebaseAdmin_1.getFirestore)()
        .collectionGroup('credit_transactions')
        .orderBy('date', 'desc')
        .get();
    return snap.docs.map((creditDoc) => {
        const d = creditDoc.data();
        return {
            id: creditDoc.id,
            userId: creditDoc.ref.parent.parent?.id ?? '',
            type: String(d['type'] ?? ''),
            reason: String(d['reason'] ?? ''),
            amount: typeof d['amount'] === 'number' ? d['amount'] : 0,
            balanceAfter: typeof d['balanceAfter'] === 'number' ? d['balanceAfter'] : 0,
            date: formatTimestamp(d['date']),
        };
    });
});
//# sourceMappingURL=adminOps.js.map