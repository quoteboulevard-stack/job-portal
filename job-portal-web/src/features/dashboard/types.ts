export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string | number;
  icon?: string;
}

export interface DashboardBarDatum {
  label: string;
  value: number;
}

export interface DashboardApplicant {
  name: string;
  score: number;
  skills: string[];
}

export interface JobSeekerDashboardData {
  stats: DashboardStat[];
  fitScores: DashboardBarDatum[];
  skills: DashboardBarDatum[];
}

export interface EmployerDashboardData {
  stats: DashboardStat[];
  funnel: DashboardBarDatum[];
  applicants: DashboardApplicant[];
}
