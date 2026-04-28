import type { UserRole } from '@job-portal/shared';
export type { UserRole };

export interface AuthUser {
  uid:      string;
  email:    string;
  name:     string;
  role:     UserRole;
  location: string;
}

export interface LoginPayload {
  email:    string;
  password: string;
}

export interface SignupPayload {
  email:    string;
  password: string;
  name:     string;
  role:     UserRole;
  location: string;
}

export interface AuthState {
  user:    AuthUser | null;
  loading: boolean;
  error:   string | null;
}
