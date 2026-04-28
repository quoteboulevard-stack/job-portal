import { useEffect, useState } from "react";
import {
  deleteApplication,
  listAllApplications,
  type AdminApplicationRecord,
} from "../services/adminService";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  applied:     { bg: "#EFF6FF", color: "#1D4ED8" },
  shortlisted: { bg: "#FEF3C7", color: "#92400E" },
  interview:   { bg: "#F5F3FF", color: "#6D28D9" },
  offer:       { bg: "#F0FDF4", color: "#166534" },
  rejected:    { bg: "#FEF2F2", color: "#B91C1C" },
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listAllApplications()
      .then(setApplications)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load applications."))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    return (
      !q ||
      a.applicantName.toLowerCase().includes(q) ||
      a.applicantEmail.toLowerCase().includes(q) ||
      a.jobTitle.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q)
    );
  });

  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Applications</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          All applications across every employer. {!loading && `(${applications.length} total)`}
        </p>
      </div>

      {error ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>{error}</div>
      ) : null}

      <input
        type="search"
        placeholder="Search by applicant, job, company, or status…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }}
      />

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>Loading applications…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>No applications found.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Applicant", "Email", "Job", "Company", "Status", "Fit score", "Applied", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#6B7280", fontWeight: 700, borderBottom: "1px solid #E5E7EB" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const badge = STATUS_COLORS[a.status] ?? { bg: "#F3F4F6", color: "#6B7280" };
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>{a.applicantName || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 14 }}>{a.applicantEmail || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#111827" }}>{a.jobTitle}</td>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 14 }}>{a.company}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 13, fontWeight: 700, background: badge.bg, color: badge.color }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "#111827" }}>
                      {a.fitScore !== null ? `${a.fitScore}%` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 14 }}>{a.appliedAt}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {confirmId === a.id ? (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => void remove(a.id)}
                            disabled={deletingId === a.id}
                            style={{ padding: "4px 10px", border: 0, borderRadius: 6, background: "#DC2626", color: "#FFF", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                          >
                            {deletingId === a.id ? "…" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            style={{ padding: "4px 10px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#FFF", color: "#374151", fontSize: 13, cursor: "pointer" }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(a.id)}
                          style={{ padding: "4px 10px", border: "1px solid #FECACA", borderRadius: 6, background: "#FEF2F2", color: "#B91C1C", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
