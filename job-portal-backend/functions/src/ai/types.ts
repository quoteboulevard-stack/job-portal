export interface FitScoreResult {
  fit_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendation: string;
}

export interface FitScoreDocument {
  applicationId: string;
  fit_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendation: string;
  status: 'success' | 'error';
  error?: string;
  timestamp: FirebaseFirestore.Timestamp;
}

// ─── Missing Skills Analyzer ──────────────────────────────────────────────────

export interface SkillGap {
  skill: string;
  learn_time_months: number;
  resources: string[];
  job_impact: string;
}

export interface MissingSkillsInput {
  applicationId: string;
  // jobId is intentionally absent: the backend derives it from the
  // application document after ownership verification so the caller
  // cannot substitute a different job's requirements.
}

export interface MissingSkillsDetail {
  applicationId: string;
  jobId: string;
  skill_gaps: SkillGap[];
  generatedAt: FirebaseFirestore.Timestamp;
}
