import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  listApplicantsForEmployer,
  updateApplicationStatus,
} from "../../applications/services/applicationService";
import type {
  ApplicationRecord,
  ApplicationStatus,
} from "../../applications/types";
import Button from "../../../shared/components/Button";

const statuses: ApplicationStatus[] = [
  "applied",
  "shortlisted",
  "interview",
  "offer",
  "rejected",
];

export default function EmployerApplicantsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    if (!user) return Promise.resolve();
    setLoading(true);
    return listApplicantsForEmployer(user.uid)
      .then((data) => {
        setApplications(data);
        setError(null);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load applicants."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [user?.uid]);

  const grouped = useMemo(() => {
    return statuses.map((status) => ({
      status,
      items: applications.filter((application) => application.status === status),
    }));
  }, [applications]);

  const setStatus = async (
    applicationId: string,
    status: ApplicationStatus
  ) => {
    try {
      setSavingId(applicationId);
      await updateApplicationStatus(applicationId, status);
      await load();
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Failed to update applicant."
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Applicants</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          Review live applications submitted against your jobs.
        </p>
      </div>

      {error ? (
        <div style={{ padding: 16, color: "#B91C1C", background: "#FEF2F2", borderRadius: 12 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          Loading applicants...
        </div>
      ) : applications.length === 0 ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          No applicants yet.
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.status} style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, color: "#111827", textTransform: "capitalize" }}>
              {group.status} ({group.items.length})
            </h2>
            {group.items.length === 0 ? (
              <div style={{ padding: 16, border: "1px dashed #D1D5DB", borderRadius: 12 }}>
                No applicants in this stage.
              </div>
            ) : (
              group.items.map((application) => (
                <article
                  key={application.id}
                  style={{
                    display: "grid",
                    gap: 12,
                    padding: 20,
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    background: "#FFFFFF",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div>
                      <h3 style={{ margin: 0, color: "#111827" }}>
                        {application.applicantName}
                      </h3>
                      <p style={{ margin: "6px 0 0", color: "#6B7280" }}>
                        {application.jobTitle} · {application.company}
                      </p>
                      <p style={{ margin: "6px 0 0", color: "#6B7280" }}>
                        {application.applicantEmail || "No applicant email"}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {typeof application.fitScore === "number" ? (
                        <strong style={{ color: "#059669" }}>
                          Fit score {application.fitScore}%
                        </strong>
                      ) : null}
                      <p style={{ margin: "6px 0 0", color: "#6B7280" }}>
                        Applied {application.appliedDate}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {statuses
                      .filter((status) => status !== application.status)
                      .map((status) => (
                        <Button
                          key={status}
                          variant={status === "rejected" ? "danger" : "secondary"}
                          size="sm"
                          loading={savingId === application.id}
                          onClick={() => void setStatus(application.id, status)}
                        >
                          Mark {status}
                        </Button>
                      ))}
                  </div>
                </article>
              ))
            )}
          </section>
        ))
      )}
    </section>
  );
}
