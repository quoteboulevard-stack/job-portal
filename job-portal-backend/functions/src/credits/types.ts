export interface CreditTransaction {
  type: 'deduction' | 'topup' | 'refund';
  reason: string;
  amount: number;
  balanceAfter: number;
  date: FirebaseFirestore.Timestamp;
  referenceId: string;
}

export interface UserCredits {
  balance: number;
  totalAdded: number;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CreditSummary {
  available: number;
  used: number;
  total: number;
}

export interface MessageData {
  senderId: string;       // authoritative field — who sent the message
  fromUserId?: string;    // legacy alias, same as senderId
  status: 'sent' | 'seen' | 'expired';
  creditDeducted?: boolean;
  creditsDeductedAt?: FirebaseFirestore.Timestamp;
  creditError?: string;
  creditRefunded?: boolean;
}
