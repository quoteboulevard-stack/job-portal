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
exports.requestMessage = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const MAX_SUBJECT_LENGTH = 160;
const MAX_BODY_LENGTH = 2000;
exports.requestMessage = functions
    .runWith({ timeoutSeconds: 30, memory: "256MB" })
    .https.onCall(async (data, context) => {
    if (!context.auth?.uid) {
        throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
    }
    const toUserId = String(data?.toUserId ?? "").trim();
    const subject = String(data?.subject ?? "").trim();
    const body = String(data?.body ?? "").trim();
    if (!toUserId) {
        throw new functions.https.HttpsError("invalid-argument", "toUserId is required.");
    }
    if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
        throw new functions.https.HttpsError("invalid-argument", `subject is required and must be <= ${MAX_SUBJECT_LENGTH} characters.`);
    }
    if (!body || body.length > MAX_BODY_LENGTH) {
        throw new functions.https.HttpsError("invalid-argument", `body is required and must be <= ${MAX_BODY_LENGTH} characters.`);
    }
    const db = (0, firebaseAdmin_1.getFirestore)();
    const senderRef = db.collection("users").doc(context.auth.uid);
    const recipientRef = db.collection("users").doc(toUserId);
    const [senderSnap, recipientSnap] = await Promise.all([
        senderRef.get(),
        recipientRef.get(),
    ]);
    if (!senderSnap.exists || !recipientSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Sender or recipient profile not found.");
    }
    const sender = senderSnap.data();
    const recipient = recipientSnap.data();
    if (sender["role"] !== "job_seeker") {
        throw new functions.https.HttpsError("permission-denied", "Only job seekers can send message requests.");
    }
    if (recipient["role"] !== "employer") {
        throw new functions.https.HttpsError("permission-denied", "Messages can only be sent to employers.");
    }
    const docRef = await db.collection("messages").add({
        fromUserId: context.auth.uid,
        toUserId,
        fromName: String(sender["displayName"] ?? context.auth.token.email ?? "Job seeker"),
        toName: String(recipient["displayName"] ?? "Employer"),
        subject,
        body,
        status: "waiting",
        creditCost: 1,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { success: true, messageId: docRef.id };
});
//# sourceMappingURL=requestMessage.js.map