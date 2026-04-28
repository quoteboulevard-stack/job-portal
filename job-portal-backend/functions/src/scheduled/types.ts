export interface ExpiredMessageRow {
  messageId: string;
  fromUserId: string;
  toUserId: string;
  creditDeducted: boolean;
  creditRefunded: boolean;
}

export interface RefundJobResult {
  processed: number;
  refunded: number;
  skipped: number;
  failed: number;
}

export interface CleanupResult {
  conversationsDeleted: number;
  rejectedMessagesDeleted: number;
  chatsArchived: number;
  uploadsDeleted: number;
  errors: number;
}
