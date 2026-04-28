import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getFirestore } from "../shared/firebaseAdmin";

const MIN_SUBJECT_LENGTH = 3;
const MAX_SUBJECT_LENGTH = 160;
const MAX_BODY_LENGTH = 2000;

export const requestMessage = functions
  .runWith({ timeoutSeconds: 30, memory: "256MB" })
  .https.onCall(
    async (
      data: { toUserId: string; subject: string; body: string },
      context
    ) => {
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "Authentication required."
        );
      }

      const toUserId = String(data?.toUserId ?? "").trim();
      const subject = String(data?.subject ?? "").trim();
      const body = String(data?.body ?? "").trim();

      if (!toUserId) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "toUserId is required."
        );
      }
      if (!subject || subject.length < MIN_SUBJECT_LENGTH || subject.length > MAX_SUBJECT_LENGTH) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `subject must be ${MIN_SUBJECT_LENGTH}–${MAX_SUBJECT_LENGTH} characters.`
        );
      }
      if (!body || body.length > MAX_BODY_LENGTH) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `body is required and must be <= ${MAX_BODY_LENGTH} characters.`
        );
      }

      const db = getFirestore();
      const senderRef = db.collection("users").doc(context.auth.uid);
      const recipientRef = db.collection("users").doc(toUserId);
      const [senderSnap, recipientSnap] = await Promise.all([
        senderRef.get(),
        recipientRef.get(),
      ]);

      if (!senderSnap.exists || !recipientSnap.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Sender or recipient profile not found."
        );
      }

      const sender = senderSnap.data() as Record<string, unknown>;
      const recipient = recipientSnap.data() as Record<string, unknown>;

      if (sender["role"] !== "job_seeker") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Only job seekers can send message requests."
        );
      }

      if (recipient["role"] !== "employer") {
        throw new functions.https.HttpsError(
          "permission-denied",
          "Messages can only be sent to employers."
        );
      }

      // Prevent duplicate active requests to the same employer.
      const existing = await db.collection("messages")
        .where("fromUserId", "==", context.auth.uid)
        .where("toUserId",   "==", toUserId)
        .where("status", "in", ["waiting", "sent", "seen"])
        .limit(1)
        .get();
      if (!existing.empty) {
        throw new functions.https.HttpsError(
          "already-exists",
          "You already have an active message request to this employer."
        );
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
    }
  );
