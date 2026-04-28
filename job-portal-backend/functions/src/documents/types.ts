export type SupportedMimeType = 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
}

export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  year: string;
}

export interface ResumeDocument {
  userId: string;
  parsed: ParsedResume;
  meta: FileMeta;
  status: 'success' | 'error';
  error?: string;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface FileMeta {
  fileName: string;
  fileSize: number;
  uploadedAt: FirebaseFirestore.Timestamp;
  mimeType: SupportedMimeType;
}

// ─── Job Description ──────────────────────────────────────────────────────────

export interface ParsedJD {
  title: string | null;
  requirements: string[];
  skills: string[];
  experience_years: number | null;
  salary_range: SalaryRange | null;
}

export interface SalaryRange {
  min: number | null;
  max: number | null;
  currency: string;
}

export interface JDDocument {
  jobId: string;
  parsed: ParsedJD;
  meta: FileMeta;
  status: 'success' | 'error';
  error?: string;
  updatedAt: FirebaseFirestore.Timestamp;
}
