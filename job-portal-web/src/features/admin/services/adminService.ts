import { httpsCallable } from "firebase/functions";
import { functions } from "../../../shared/services/firebaseService";
import type { UserRole } from "../../auth/types";

export interface PagedResult<T> {
  items: T[];
  nextPageToken?: string;
  cursorValid?: boolean;
}

export interface AdminUserRecord {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  location: string;
  balance: number;
  createdAt: string;
}

export interface AdminJobRecord {
  id: string;
  title: string;
  company: string;
  location: string;
  employerId: string;
  status: string;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalApplications: number;
  totalMessages: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const call = httpsCallable<void, AdminStats>(functions, "getAdminStats");
  const result = await call();
  return result.data;
}

export async function listAllUsers(
  params?: { pageSize?: number; startAfter?: string }
): Promise<PagedResult<AdminUserRecord>> {
  const call = httpsCallable<
    { pageSize?: number; startAfter?: string },
    { items: AdminUserRecord[]; nextPageToken?: string; cursorValid?: boolean }
  >(functions, "listAdminUsers");
  const result = await call(params ?? {});
  return result.data;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const call = httpsCallable<{ uid: string; role: UserRole }, { success: boolean }>(
    functions,
    "setUserRole"
  );
  await call({ uid, role });
}

export async function listAllJobs(
  params?: { pageSize?: number; startAfter?: string }
): Promise<PagedResult<AdminJobRecord>> {
  const call = httpsCallable<
    { pageSize?: number; startAfter?: string },
    { items: AdminJobRecord[]; nextPageToken?: string; cursorValid?: boolean }
  >(functions, "listAdminJobs");
  const result = await call(params ?? {});
  return result.data;
}

export async function deleteJob(jobId: string): Promise<void> {
  const call = httpsCallable<{ jobId: string }, { success: boolean }>(
    functions,
    "deleteAdminJob"
  );
  await call({ jobId });
}

// ─── Applications ─────────────────────────────────────────────────────────────

export interface AdminApplicationRecord {
  id: string;
  jobTitle: string;
  company: string;
  applicantName: string;
  applicantEmail: string;
  employerId: string;
  status: string;
  fitScore: number | null;
  appliedAt: string;
}

export async function listAllApplications(
  params?: { pageSize?: number; startAfter?: string }
): Promise<PagedResult<AdminApplicationRecord>> {
  const call = httpsCallable<
    { pageSize?: number; startAfter?: string },
    { items: AdminApplicationRecord[]; nextPageToken?: string; cursorValid?: boolean }
  >(functions, "listAdminApplications");
  const result = await call(params ?? {});
  return result.data;
}

export async function deleteApplication(applicationId: string): Promise<void> {
  const call = httpsCallable<{ applicationId: string }, { success: boolean }>(
    functions,
    "deleteAdminApplication"
  );
  await call({ applicationId });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface AdminMessageRecord {
  id: string;
  fromName: string;
  toName: string;
  subject: string;
  body: string;
  status: string;
  creditCost: number;
  createdAt: string;
}

export async function listAllMessages(
  params?: { pageSize?: number; startAfter?: string }
): Promise<PagedResult<AdminMessageRecord>> {
  const call = httpsCallable<
    { pageSize?: number; startAfter?: string },
    { items: AdminMessageRecord[]; nextPageToken?: string; cursorValid?: boolean }
  >(functions, "listAdminMessages");
  const result = await call(params ?? {});
  return result.data;
}

export async function deleteMessage(messageId: string): Promise<void> {
  const call = httpsCallable<{ messageId: string }, { success: boolean }>(
    functions,
    "deleteAdminMessage"
  );
  await call({ messageId });
}

// ─── Credit transactions ──────────────────────────────────────────────────────

export interface AdminCreditTransaction {
  id: string;
  userId: string;
  type: string;
  reason: string;
  amount: number;
  balanceAfter: number;
  date: string;
}

export async function listAllCreditTransactions(
  params?: { pageSize?: number; startAfter?: string }
): Promise<PagedResult<AdminCreditTransaction>> {
  const call = httpsCallable<
    { pageSize?: number; startAfter?: string },
    { items: AdminCreditTransaction[]; nextPageToken?: string; cursorValid?: boolean }
  >(functions, "listAdminCreditTransactions");
  const result = await call(params ?? {});
  return result.data;
}
