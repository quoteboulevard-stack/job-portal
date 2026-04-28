import { useEffect, useState } from "react";
import { deleteJob, listAllJobs, type AdminJobRecord } from "../services/adminService";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    listAllJobs()
      .then(setJobs)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load jobs."))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (jobId: string) => {
    try {
      setDeletingId(jobId);
      await deleteJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job.");
    } finally {
      setDeletingId(null);
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
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Jobs</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          All jobs in the platform. Delete removes the listing permanently.
        </p>
      </div>

      {error ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          Loading jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          No jobs found.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {jobs.map((job) => (
            <article
              key={job.id}
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
                  <h3 style={{ margin: 0, color: "#111827" }}>{job.title}</h3>
                  <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: 14 }}>
                    {job.company} · {job.location}
                  </p>
                  <p style={{ margin: "4px 0 0", color: "#9CA3AF", fontSize: 13 }}>
                    Posted {job.createdAt} · Employer ID: {job.employerId}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <span style={{
                    padding: "2px 10px",
                    borderRadius: 99,
                    fontSize: 13,
                    fontWeight: 700,
                    background: job.status === "open" ? "#F0FDF4" : "#F3F4F6",
                    color: job.status === "open" ? "#166534" : "#6B7280",
                  }}>
                    {job.status}
                  </span>
                  {confirmId === job.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void remove(job.id)}
                        disabled={deletingId === job.id}
                        style={{
                          padding: "6px 14px",
                          border: 0,
                          borderRadius: 6,
                          background: "#DC2626",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        {deletingId === job.id ? "Deleting..." : "Confirm delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        style={{
                          padding: "6px 14px",
                          border: "1px solid #E5E7EB",
                          borderRadius: 6,
                          background: "#FFFFFF",
                          color: "#374151",
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(job.id)}
                      style={{
                        padding: "6px 14px",
                        border: "1px solid #FECACA",
                        borderRadius: 6,
                        background: "#FEF2F2",
                        color: "#B91C1C",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
