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
exports.setUserRole = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const ALLOWED_ROLES = ['job_seeker', 'employer', 'admin'];
const log = (msg, data) => functions.logger.info(`[setUserRole] ${msg}`, data ?? {});
exports.setUserRole = functions
    .runWith({ timeoutSeconds: 30, memory: '256MB' })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
    }
    const db = (0, firebaseAdmin_1.getFirestore)();
    const callerSnap = await db.collection('users').doc(context.auth.uid).get();
    if (!callerSnap.exists || callerSnap.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Admin role required.');
    }
    const { uid, role } = data ?? {};
    if (!uid || typeof uid !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'uid is required.');
    }
    if (!ALLOWED_ROLES.includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', `role must be one of: ${ALLOWED_ROLES.join(', ')}.`);
    }
    const targetSnap = await db.collection('users').doc(uid).get();
    if (!targetSnap.exists) {
        throw new functions.https.HttpsError('not-found', `User ${uid} not found.`);
    }
    await db.collection('users').doc(uid).set({ role, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    log('Role updated', { targetUid: uid, role, byAdmin: context.auth.uid });
    return { success: true };
});
//# sourceMappingURL=setUserRole.js.map