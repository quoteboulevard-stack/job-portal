export type MessageStatus =
  | "waiting"
  | "sent"
  | "seen"
  | "accepted"
  | "rejected"
  | "expired"
  | "invalid";

export interface MessageRequestRecord {
  id: string;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  subject: string;
  body: string;
  status: MessageStatus;
  date: string;
  creditCost: number;
}

export interface ConversationRecord {
  id: string;
  title: string;
  counterpartName: string;
  roleLabel: string;
  lastMessage: string;
  lastUpdated: string;
}

export interface ChatMessageRecord {
  id: string;
  text: string;
  senderId: string;
  time: string;
  receipt?: "seen" | "read";
}
