// ─── Primitives ───────────────────────────────────────────────────────────────

export type ISODateString = string;
export type UserRole = 'job_seeker' | 'employer' | 'admin';
export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'fulltime' | 'parttime' | 'contract' | 'internship' | 'freelance';
export type ApplicationStatus = 'pending' | 'reviewed' | 'accepted' | 'rejected' | 'withdrawn';
export type MessageStatus = 'waiting' | 'sent' | 'seen' | 'accepted' | 'rejected' | 'expired' | 'invalid';
export type TransactionType = 'purchase' | 'deduction' | 'refund' | 'topup';
export type CreditErrorCode = 'insufficient_credits' | 'transaction_failed';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: ISODateString;
  updatedAt?: ISODateString;
}

export interface JobSeekerProfile extends User {
  role: 'job_seeker';
  resumeUrl?: string;
  skills: string[];
  experienceYears: number;
  fcmToken?: string;
}

export interface EmployerProfile extends User {
  role: 'employer';
  company: string;
  companyLogoUrl?: string;
}

// ─── Job ──────────────────────────────────────────────────────────────────────

export interface SalaryRange {
  min: number | null;
  max: number | null;
  currency: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  employerId: string;
  requirements: string[];
  skills: string[];
  salary: SalaryRange | null;
  workMode: WorkMode;
  employmentType: EmploymentType;
  location: string;
  experienceYears: number | null;
  description?: string;
  createdAt: ISODateString;
  updatedAt?: ISODateString;
  expiresAt?: ISODateString;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  from: string;           // senderId (job_seeker)
  to: string;             // recipientId (employer)
  subject?: string;
  text: string;
  status: MessageStatus;
  creditDeducted: boolean;
  creditRefunded?: boolean;
  creditError?: CreditErrorCode;
  createdAt: ISODateString;
  expiresAt: ISODateString;
  acceptedAt?: ISODateString;
  rejectedAt?: ISODateString;
  rejectionReason?: string;
}

// ─── Application ──────────────────────────────────────────────────────────────

export interface FitScoreDetail {
  fit_score: number;            // 0–100
  matched_skills: string[];
  missing_skills: string[];
  recommendation: string;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  fit_score: number | null;
  fitDetail?: FitScoreDetail;
  resumeUrl?: string;
  coverNote?: string;
  createdAt: ISODateString;
  updatedAt?: ISODateString;
}

// ─── Credits ──────────────────────────────────────────────────────────────────

export interface CreditTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  reason: string;
  referenceId?: string;       // messageId, paymentIntentId, etc.
  date: ISODateString;
}

export interface Credit {
  available: number;
  used: number;
  total: number;
  transactions: CreditTransaction[];
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'message_received'
  | 'message_accepted'
  | 'message_rejected'
  | 'job_matched'
  | 'credit_purchased'
  | 'credit_refunded';

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;
  title: string;
  body: string;
  read: boolean;
  referenceId?: string;
  createdAt: ISODateString;
}

// ─── Conversation ─────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  messageId: string;
  jobSeekerId: string;
  employerId: string;
  status: 'active' | 'closed';
  createdAt: ISODateString;
  expiresAt: ISODateString;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
  timestamp: ISODateString;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
  timestamp: ISODateString;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
