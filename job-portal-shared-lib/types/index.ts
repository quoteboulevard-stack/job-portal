// ─── Primitives ───────────────────────────────────────────────────────────────

export type ISODateString = string;
export type UserRole = 'job_seeker' | 'employer' | 'admin';
export type WorkMode = 'remote' | 'hybrid' | 'onsite';
export type EmploymentType = 'fulltime' | 'parttime' | 'contract' | 'internship' | 'freelance';
export type JobExperience = 'entry' | 'mid' | 'senior';
export type JobStatus = 'open' | 'closed' | 'expired';
export type ApplicationStatus = 'applied' | 'shortlisted' | 'interview' | 'offer' | 'rejected';
export type MessageStatus = 'waiting' | 'sent' | 'seen' | 'accepted' | 'rejected' | 'expired' | 'invalid';
export type TransactionType = 'purchase' | 'deduction' | 'refund' | 'topup';
export type CreditErrorCode = 'insufficient_credits' | 'transaction_failed';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
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

export interface Job {
  id: string;
  title: string;
  company: string;
  employerId: string;
  description: string;
  requirements: string[];
  skills: string[];
  perks: string[];
  salary: number | null;
  workMode: WorkMode;
  employmentType: EmploymentType;
  experience: JobExperience;
  location: string;
  status: JobStatus;
  postedAt: ISODateString;
  createdAt: ISODateString;
  updatedAt?: ISODateString;
  expiresAt?: ISODateString;
}

// ─── Message ──────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  subject?: string;
  body: string;
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
  totalAdded: number;
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
