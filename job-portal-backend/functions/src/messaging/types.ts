import type { UserRole, MessageStatus } from '@job-portal/shared';
export type { UserRole, MessageStatus };

export interface MessageDocument {
  messageId: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  status: MessageStatus;
  expiresAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  creditDeducted?: boolean;
  creditRefunded?: boolean;
}

export interface NotificationDocument {
  type: 'new_message';
  messageId: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  read: boolean;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface UserProfile {
  role: UserRole;
  displayName: string;
  email: string;
}

export interface BlockEntry {
  blockedAt: FirebaseFirestore.Timestamp;
  unblockAt: FirebaseFirestore.Timestamp;
  reason: string;
  messageId: string;
}

export interface ConversationDocument {
  messageId: string;
  jobSeekerId: string;
  employerId: string;
  status: 'active' | 'closed';
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
}
