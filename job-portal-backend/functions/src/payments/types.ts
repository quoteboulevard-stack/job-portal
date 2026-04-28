export type PlanType = 'basic' | 'pro' | 'enterprise';

export interface PaymentMetadata {
  userId: string;
  credits: string;   // Stripe metadata values are always strings
  plan: PlanType;
}

export interface PurchaseTransaction {
  type: 'purchase';
  plan: PlanType;
  credits: number;
  amountPaid: number;   // in cents
  currency: string;
  stripePaymentIntentId: string;
  date: FirebaseFirestore.Timestamp;
  balanceAfter: number;
}

export interface ReceiptEmailData {
  toEmail: string;
  displayName: string;
  credits: number;
  amountPaid: number;
  currency: string;
  plan: PlanType;
  paymentIntentId: string;
}

// ─── Razorpay ─────────────────────────────────────────────────────────────────

export interface RazorpayNotes {
  userId: string;
  credits: string;   // notes values are always strings
  plan?: PlanType;
}

export interface RazorpayWebhookPayload {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        amount: number;   // in paise
        currency: string;
        notes: RazorpayNotes;
      };
    };
  };
}

export interface RazorpayTransaction {
  type: 'purchase';
  plan: PlanType | 'unknown';
  credits: number;
  amountPaid: number;   // in paise
  currency: string;
  razorpayPaymentId: string;
  date: FirebaseFirestore.Timestamp;
  balanceAfter: number;
}
