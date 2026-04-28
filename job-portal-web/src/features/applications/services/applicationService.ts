import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../shared/services/firebaseService";
import {
  callCreateApplication,
  callUpdateApplicationStatus,
} from "../../../shared/services/functionsService";
import type {
  ApplicationCreatePayload,
  ApplicationRecord,
  ApplicationStatus,
} from "../types";

function formatDate(value: unknown): string {
  const raw = value as { toDate?: () => Date } | undefined;
  if (raw?.toDate) {
    return raw.toDate().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeStatus(value: unknown): ApplicationStatus {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "shortlisted") return "shortlisted";
  if (normalized === "interview") return "interview";
  if (normalized === "offer" || normalized === "accepted") return "offer";
  if (normalized === "rejected") return "rejected";
  return "applied";
}

function mapApplication(id: string, data: Record<string, unknown>): ApplicationRecord {
  return {
    id,
    jobId: String(data["jobId"] ?? ""),
    jobTitle: String(data["jobTitle"] ?? "Unknown role"),
    company: String(data["company"] ?? "Unknown company"),
    applicantId: String(data["applicantId"] ?? data["userId"] ?? ""),
    employerId: String(data["employerId"] ?? ""),
    applicantName: String(data["applicantName"] ?? "Applicant"),
    applicantEmail: String(data["applicantEmail"] ?? ""),
    status: normalizeStatus(data["status"]),
    appliedDate: formatDate(data["appliedAt"] ?? data["createdAt"]),
    fitScore:
      typeof data["fitScore"] === "number"
        ? data["fitScore"]
        : typeof data["fit_score"] === "number"
          ? data["fit_score"]
          : undefined,
    updatedAt: formatDate(data["updatedAt"] ?? data["appliedAt"]),
  };
}

export async function createApplication(
  payload: ApplicationCreatePayload
): Promise<string> {
  const { applicationId } = await callCreateApplication({
    jobId: payload.jobId,
    jobTitle: payload.jobTitle,
    company: payload.company,
    employerId: payload.employerId,
  });
  return applicationId;
}

export async function listApplicationsForUser(
  userId: string
): Promise<ApplicationRecord[]> {
  const byApplicant = await getDocs(
    query(collection(db, "applications"), where("applicantId", "==", userId))
  );

  if (!byApplicant.empty) {
    return byApplicant.docs.map((applicationDoc) =>
      mapApplication(applicationDoc.id, applicationDoc.data() as Record<string, unknown>)
    );
  }

  const byLegacyUser = await getDocs(
    query(collection(db, "applications"), where("userId", "==", userId))
  );

  return byLegacyUser.docs.map((applicationDoc) =>
    mapApplication(applicationDoc.id, applicationDoc.data() as Record<string, unknown>)
  );
}

export async function listApplicantsForEmployer(
  employerId: string
): Promise<ApplicationRecord[]> {
  const snap = await getDocs(
    query(collection(db, "applications"), where("employerId", "==", employerId))
  );

  return snap.docs.map((applicationDoc) =>
    mapApplication(applicationDoc.id, applicationDoc.data() as Record<string, unknown>)
  );
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus
): Promise<void> {
  await callUpdateApplicationStatus({ applicationId, status });
}
