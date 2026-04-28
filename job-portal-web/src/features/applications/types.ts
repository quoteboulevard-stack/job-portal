export type ApplicationStatus =
  | "applied"
  | "shortlisted"
  | "interview"
  | "offer"
  | "rejected";

export interface ApplicationRecord {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  applicantId: string;
  employerId: string;
  applicantName: string;
  applicantEmail: string;
  status: ApplicationStatus;
  appliedDate: string;
  fitScore?: number;
  updatedAt?: string;
}

export interface ApplicationCreatePayload {
  jobId: string;
}
