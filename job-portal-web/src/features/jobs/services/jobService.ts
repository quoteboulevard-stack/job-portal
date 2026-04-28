import {
  type QueryConstraint,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { db } from "../../../shared/services/firebaseService";
import { callCreateJob } from "../../../shared/services/functionsService";
import type { JobDraft, JobExperience, JobRecord, WorkMode, EmploymentType } from "../types";

export interface JobPage {
  jobs: JobRecord[];
  hasMore: boolean;
  lastJobId: string | null;
}

const PAGE_SIZE = 20;

function toWorkMode(value: unknown): WorkMode {
  switch (String(value ?? "").toLowerCase()) {
    case "remote": return "remote";
    case "hybrid": return "hybrid";
    default:       return "onsite";
  }
}

function toEmploymentType(value: unknown): EmploymentType {
  switch (String(value ?? "").toLowerCase()) {
    case "internship":               return "internship";
    case "freelance":                return "freelance";
    case "contract":                 return "contract";
    case "parttime":
    case "part_time":
    case "part-time":                return "parttime";
    default:                         return "fulltime";
  }
}

function toExperience(value: unknown): JobExperience {
  const normalized = String(value ?? "").toLowerCase();
  if (normalized === "senior") return "senior";
  if (normalized === "mid") return "mid";
  return "entry";
}

function toSalaryText(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return undefined;
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function mapJob(id: string, data: Record<string, unknown>): JobRecord {
  const experience = toExperience(data["experience"] ?? data["experienceLevel"]);
  const salary =
    typeof data["salary"] === "number" && Number.isFinite(data["salary"])
      ? data["salary"]
      : undefined;

  // Backward-compat: old docs stored location+employment in a single "mode" field.
  // "remote" in the old field meant work location; everything else was employment type.
  const legacyMode = String(data["mode"] ?? data["type"] ?? "").toLowerCase();
  const workMode = toWorkMode(data["workMode"] ?? (legacyMode === "remote" ? "remote" : "onsite"));
  const employmentType = toEmploymentType(
    data["employmentType"] ?? (legacyMode !== "remote" ? legacyMode : "fulltime")
  );

  return {
    id,
    title: String(data["title"] ?? "Untitled role"),
    company: String(data["company"] ?? "Unknown company"),
    location: String(data["location"] ?? "Remote"),
    workMode,
    employmentType,
    salary,
    salaryText: toSalaryText(data["salary"]) ?? toSalaryText(data["salaryText"]),
    description: String(data["description"] ?? "No description provided yet."),
    requirements: toStringList(data["requirements"]),
    skills: toStringList(data["skills"]),
    experience,
    experienceText:
      typeof data["experienceText"] === "string" && data["experienceText"]
        ? data["experienceText"]
        : experience === "senior"
          ? "5+ years"
          : experience === "mid"
            ? "2-4 years"
            : "0-2 years",
    perks: toStringList(data["perks"]),
    fitScore:
      typeof data["fitScore"] === "number"
        ? data["fitScore"]
        : typeof data["fit_score"] === "number"
          ? data["fit_score"]
          : undefined,
    employerId: String(data["employerId"] ?? data["postedBy"] ?? ""),
  };
}

export async function fetchJobsPage(lastJobId?: string | null): Promise<JobPage> {
  const constraints: QueryConstraint[] = [orderBy("createdAt", "desc"), limit(PAGE_SIZE + 1)];

  if (lastJobId) {
    const cursorSnap = await getDoc(doc(db, "jobs", lastJobId));
    if (cursorSnap.exists()) constraints.push(startAfter(cursorSnap));
  }

  const snap = await getDocs(query(collection(db, "jobs"), ...constraints));
  const hasMore = snap.docs.length > PAGE_SIZE;
  const docs = hasMore ? snap.docs.slice(0, PAGE_SIZE) : snap.docs;

  return {
    jobs: docs.map((d) => mapJob(d.id, d.data() as Record<string, unknown>)),
    hasMore,
    lastJobId: docs.length > 0 ? docs[docs.length - 1]!.id : null,
  };
}

export async function fetchJobById(jobId: string): Promise<JobRecord | null> {
  const snap = await getDoc(doc(db, "jobs", jobId));
  if (!snap.exists()) return null;
  return mapJob(snap.id, snap.data() as Record<string, unknown>);
}

export async function createJob(draft: JobDraft): Promise<string> {
  const { jobId } = await callCreateJob({
    title:          draft.title,
    company:        draft.company,
    location:       draft.location,
    workMode:       draft.workMode,
    employmentType: draft.employmentType,
    experience:     draft.experience,
    description:    draft.description,
    salary:         draft.salary ?? null,
    requirements:   draft.requirements,
    skills:         draft.skills,
    perks:          draft.perks,
  });
  return jobId;
}
