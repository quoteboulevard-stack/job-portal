import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../shared/services/firebaseService";
import {
  callMarkMessageSeen,
  callAcceptMessage,
  callRejectMessage,
  callRequestMessage,
  callSendChatMessage,
} from "../../../shared/services/functionsService";
import type {
  ChatMessageRecord,
  ConversationRecord,
  MessageRequestRecord,
  MessageStatus,
} from "../types";

function formatTimestamp(value: unknown): string {
  const raw = value as { toDate?: () => Date } | undefined;
  if (raw?.toDate) {
    return raw.toDate().toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return new Date().toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeMessageStatus(value: unknown): MessageStatus {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "read") return "seen";
  const valid: MessageStatus[] = [
    "waiting", "sent", "seen", "accepted", "rejected", "expired", "invalid",
  ];
  if (valid.includes(normalized as MessageStatus)) return normalized as MessageStatus;
  return "waiting";
}

function mapMessageRequest(
  id: string,
  data: Record<string, unknown>
): MessageRequestRecord {
  return {
    id,
    fromUserId: String(data["fromUserId"] ?? data["senderId"] ?? data["fromId"] ?? ""),
    toUserId: String(data["toUserId"] ?? data["recipientId"] ?? data["toId"] ?? ""),
    fromName: String(data["fromName"] ?? "Job seeker"),
    toName: String(data["toName"] ?? "Employer"),
    subject: String(data["subject"] ?? data["jobTitle"] ?? "Message request"),
    body: String(data["body"] ?? data["text"] ?? data["content"] ?? ""),
    status: normalizeMessageStatus(data["status"]),
    date: formatTimestamp(data["createdAt"] ?? data["updatedAt"]),
    creditCost:
      typeof data["creditCost"] === "number"
        ? data["creditCost"]
        : typeof data["amount"] === "number"
          ? data["amount"]
          : 1,
  };
}

function mapConversation(
  id: string,
  data: Record<string, unknown>,
  currentUserId: string
): ConversationRecord {
  const jobSeekerId = String(data["jobSeekerId"] ?? "");
  const employerId = String(data["employerId"] ?? "");
  const title = String(data["title"] ?? "Conversation");
  const counterpartName =
    currentUserId === employerId
      ? String(data["jobSeekerName"] ?? "Job seeker")
      : String(data["employerName"] ?? "Employer");

  return {
    id,
    title,
    counterpartName,
    roleLabel: String(data["roleLabel"] ?? ""),
    lastMessage: String(data["lastMessage"] ?? "No messages yet."),
    lastUpdated: formatTimestamp(data["lastMessageAt"] ?? data["createdAt"]),
  };
}

function mapChatMessage(
  id: string,
  data: Record<string, unknown>,
  currentUserId: string
): ChatMessageRecord {
  return {
    id,
    text: String(data["text"] ?? ""),
    senderId: String(data["senderId"] ?? currentUserId),
    time: formatTimestamp(data["sentAt"] ?? data["createdAt"]),
    receipt:
      Array.isArray(data["readBy"]) && (data["readBy"] as unknown[]).length > 1
        ? "read"
        : "seen",
  };
}

export async function listMessageRequestsForUser(
  userId: string
): Promise<MessageRequestRecord[]> {
  const [sentSnap, receivedSnap] = await Promise.all([
    getDocs(query(collection(db, "messages"), where("fromUserId", "==", userId))),
    getDocs(query(collection(db, "messages"), where("toUserId", "==", userId))),
  ]);

  const seen = new Set<string>();
  const results: MessageRequestRecord[] = [];
  for (const docSnap of [...sentSnap.docs, ...receivedSnap.docs]) {
    if (!seen.has(docSnap.id)) {
      seen.add(docSnap.id);
      results.push(mapMessageRequest(docSnap.id, docSnap.data() as Record<string, unknown>));
    }
  }
  return results.sort((a, b) => b.date.localeCompare(a.date));
}

export async function listPendingEmployerMessages(
  employerId: string
): Promise<MessageRequestRecord[]> {
  const messages = await listMessageRequestsForUser(employerId);
  return messages.filter(
    (message) =>
      message.toUserId === employerId &&
      (message.status === "waiting" || message.status === "sent" || message.status === "seen")
  );
}

export async function listConversationsForUser(
  userId: string,
  role: "job_seeker" | "employer" | "admin"
): Promise<ConversationRecord[]> {
  const field = role === "employer" ? "employerId" : "jobSeekerId";
  const snap = await getDocs(
    query(collection(db, "conversations"), where(field, "==", userId))
  );
  return snap.docs.map((conversationDoc) =>
    mapConversation(
      conversationDoc.id,
      conversationDoc.data() as Record<string, unknown>,
      userId
    )
  );
}

/**
 * Mark a message as seen by the employer. Fire-and-forget — the UI
 * should not block on this. Triggers credit deduction via deductCredit.ts.
 */
export async function markMessageAsSeen(messageId: string): Promise<void> {
  try {
    await callMarkMessageSeen(messageId);
  } catch {
    // Best-effort: if it fails (already seen, expired, etc.) don't block the UI
  }
}

export async function acceptMessageRequest(
  message: MessageRequestRecord,
  employerId: string
): Promise<string> {
  const result = await callAcceptMessage(message.id);
  return result.conversationId;
}

export async function rejectMessageRequest(messageId: string): Promise<void> {
  await callRejectMessage(messageId, "Not a fit right now.");
}

export function subscribeToChat(
  conversationId: string,
  currentUserId: string,
  callback: (messages: ChatMessageRecord[]) => void
): () => void {
  return onSnapshot(
    query(
      collection(db, "conversations", conversationId, "messages"),
      orderBy("sentAt", "asc")
    ),
    (snap) => {
      callback(
        snap.docs.map((messageDoc) =>
          mapChatMessage(
            messageDoc.id,
            messageDoc.data() as Record<string, unknown>,
            currentUserId
          )
        )
      );
    }
  );
}

export async function sendChatMessage(
  conversationId: string,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  await callSendChatMessage({ conversationId, text: trimmed });
}

export async function sendMessageRequest(payload: {
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  subject: string;
  body: string;
}): Promise<void> {
  await callRequestMessage({
    toUserId: payload.toUserId,
    subject: payload.subject,
    body: payload.body,
  });
}
