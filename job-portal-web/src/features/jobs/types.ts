import type { WorkMode, EmploymentType } from '@job-portal/shared';
export type { WorkMode, EmploymentType };

export type JobExperience = "entry" | "mid" | "senior";

export interface JobRecord {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salary?: number;
  salaryText?: string;
  description: string;
  requirements: string[];
  skills: string[];
  experience: JobExperience;
  experienceText: string;
  perks: string[];
  fitScore?: number;
  employerId: string;
}

export interface JobDraft {
  title: string;
  company: string;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  salary?: number;
  description: string;
  requirements: string[];
  skills: string[];
  experience: JobExperience;
  perks: string[];
}
