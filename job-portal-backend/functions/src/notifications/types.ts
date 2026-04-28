import type { NotificationType } from '@job-portal/shared';
export type { NotificationType };

interface BaseEmailData {
  toEmail: string;
  displayName: string;
}

export interface MessageReceivedData extends BaseEmailData {
  type: 'message_received';
  senderName: string;
  messageId: string;
}

export interface MessageAcceptedData extends BaseEmailData {
  type: 'message_accepted';
  employerName: string;
  messageId: string;
}

export interface MessageRejectedData extends BaseEmailData {
  type: 'message_rejected';
  reason: string;
  messageId: string;
}

export interface CreditPurchasedData extends BaseEmailData {
  type: 'credit_purchased';
  credits: number;
  amountPaid: number;   // in smallest currency unit (cents / paise)
  currency: string;
  plan: string;
  paymentId: string;
}

export interface CreditRefundedData extends BaseEmailData {
  type: 'credit_refunded';
  credits: number;
  reason: string;
}

export type EmailNotificationData =
  | MessageReceivedData
  | MessageAcceptedData
  | MessageRejectedData
  | CreditPurchasedData
  | CreditRefundedData;

export interface EmailTemplate {
  subject: string;
  text: string;
}

// ─── Push notifications ───────────────────────────────────────────────────────

export type PushNotificationType = Extract<
  NotificationType,
  'message_received' | 'message_accepted' | 'job_matched' | 'credit_purchased'
>;

export interface FCMTokenRecord {
  fcmToken: string;
  fcmTokenUpdatedAt: FirebaseFirestore.Timestamp;
}

export interface PushPayload {
  type: PushNotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}
