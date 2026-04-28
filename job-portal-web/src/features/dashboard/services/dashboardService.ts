import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../shared/services/firebaseService";
import type {
  DashboardApplicant,
  DashboardBarDatum,
  DashboardStat,
  EmployerDashboardData,
  JobSeekerDashboardData,
} from "../types";

function scoreBuckets(scores: number[]): DashboardBarDatum[] {
  const buckets = [
    { label: "60-69", value: 0 },
    { label: "70-79", value: 0 },
    { label: "80-89", value: 0 },
    { label: "90-100", value: 0 },
  ];

  scores.forEach((score) => {
    if (score >= 90) buckets[3].value += 1;
    else if (score >= 80) buckets[2].value += 1;
    else if (score >= 70) buckets[1].value += 1;
    else if (score >= 60) buckets[0].value += 1;
  });

  return buckets;
}

export async function getJobSeekerDashboard(
  userId: string
): Promise<JobSeekerDashboardData> {
  const [applicationsSnap, userSnap] = await Promise.all([
    getDocs(query(collection(db, "applications"), where("applicantId", "==", userId))).catch(
      async () =>
        getDocs(query(collection(db, "applications"), where("userId", "==", userId)))
    ),
    getDoc(doc(db, "users", userId)),
  ]);

  const applications = applicationsSnap.docs.map((applicationDoc) =>
    applicationDoc.data() as Record<string, unknown>
  );
  const scores = applications
    .map((application) =>
      typeof application["fitScore"] === "number"
        ? application["fitScore"]
        : typeof application["fit_score"] === "number"
          ? application["fit_score"]
          : 0
    )
    .filter((score) => score > 0);

  const userData = userSnap.exists()
    ? (userSnap.data() as Record<string, unknown>)
    : {};
  const skills = Array.isArray(userData["skills"])
    ? (userData["skills"] as unknown[])
        .filter((skill): skill is string => typeof skill === "string")
        .slice(0, 8)
        .map((skill, index) => ({ label: skill, value: Math.max(8 - index, 1) }))
    : [];

  const offerCount = applications.filter((application) => {
    const status = String(application["status"] ?? "").toLowerCase();
    return status === "offer" || status === "accepted";
  }).length;

  const stats: DashboardStat[] = [
    { label: "Applications", value: applications.length, icon: "work" },
    {
      label: "In Progress",
      value: applications.filter((application) =>
        ["applied", "shortlisted", "interview"].includes(
          String(application["status"] ?? "").toLowerCase()
        )
      ).length,
      icon: "schedule",
    },
    {
      label: "Profile Views",
      value:
        typeof userData["profileViews"] === "number" ? userData["profileViews"] : 0,
      icon: "visibility",
    },
    { label: "Offers", value: offerCount, icon: "verified" },
  ];

  return {
    stats,
    fitScores: scoreBuckets(scores),
    skills,
  };
}

export async function getEmployerDashboard(
  employerId: string
): Promise<EmployerDashboardData> {
  const [jobsSnap, applicationsSnap] = await Promise.all([
    getDocs(query(collection(db, "jobs"), where("employerId", "==", employerId))),
    getDocs(
      query(collection(db, "applications"), where("employerId", "==", employerId))
    ),
  ]);

  const jobs = jobsSnap.docs.map((jobDoc) => jobDoc.data() as Record<string, unknown>);
  const applications = applicationsSnap.docs.map((applicationDoc) =>
    applicationDoc.data() as Record<string, unknown>
  );
  const scores = applications
    .map((application) =>
      typeof application["fitScore"] === "number"
        ? application["fitScore"]
        : typeof application["fit_score"] === "number"
          ? application["fit_score"]
          : 0
    )
    .filter((score) => score > 0);

  const avgScore =
    scores.length > 0
      ? `${Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)}%`
      : "0%";

  const stats: DashboardStat[] = [
    { label: "Active Jobs", value: jobs.length, icon: "work" },
    { label: "Applicants", value: applications.length, icon: "groups" },
    {
      label: "Shortlisted",
      value: applications.filter(
        (application) =>
          String(application["status"] ?? "").toLowerCase() === "shortlisted"
      ).length,
      icon: "checklist",
    },
    { label: "Avg Quality", value: avgScore, icon: "insights" },
  ];

  const funnel: DashboardBarDatum[] = [
    { label: "Applied", value: applications.length },
    {
      label: "Shortlisted",
      value: applications.filter(
        (application) =>
          String(application["status"] ?? "").toLowerCase() === "shortlisted"
      ).length,
    },
    {
      label: "Interview",
      value: applications.filter(
        (application) =>
          String(application["status"] ?? "").toLowerCase() === "interview"
      ).length,
    },
    {
      label: "Offer",
      value: applications.filter((application) => {
        const status = String(application["status"] ?? "").toLowerCase();
        return status === "offer" || status === "accepted";
      }).length,
    },
  ];

  const applicants: DashboardApplicant[] = applications
    .map((application) => ({
      name: String(application["applicantName"] ?? "Applicant"),
      score:
        typeof application["fitScore"] === "number"
          ? application["fitScore"]
          : typeof application["fit_score"] === "number"
            ? application["fit_score"]
            : 0,
      skills: Array.isArray(application["skills"])
        ? (application["skills"] as unknown[]).filter(
            (skill): skill is string => typeof skill === "string"
          )
        : [],
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return { stats, funnel, applicants };
}
