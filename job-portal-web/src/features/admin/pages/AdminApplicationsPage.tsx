import { useEffect, useState } from "react";
import {
  deleteApplication,
  listAllApplications,
  type AdminApplicationRecord,
} from "../services/adminService";
import "./AdminPages.css";

const STATUS_BADGE_CLASS: Record<string, string> = {
  applied: "admin-badge--applied",
  shortlisted: "admin-badge--shortlisted",
  interview: "admin-badge--interview",
  offer: "admin-badge--offer",
  rejected: "admin-badge--rejected",
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdminApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadPage = (startAfter?: string) => {
    if (startAfter) setLoadingMore(true);
    else setLoading(true);
    listAllApplications({ startAfter })
      .then((result) => {
        setApplications((prev) => startAfter ? [...prev, ...result.items] : result.items);
        setNextPageToken(result.nextPageToken);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load applications."))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { void loadPage(); }, []);

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
    <section className="admin-page">
      <div className="admin-page__hero">
        <h1 className="admin-page__title">Applications</h1>
        <p className="admin-page__subtitle">
          All applications across every employer. {!loading && `(${applications.length} total)`}
        </p>
      </div>

      {error ? (
        <div className="admin-page__error">{error}</div>
      ) : null}

      <input
        type="search"
        placeholder="Search by applicant, job, company, or status…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="admin-search"
      />

      {loading ? (
        <div className="admin-page__placeholder">Loading applications…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-page__placeholder">No applications found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr className="admin-table__head-row">
                {["Applicant", "Email", "Job", "Company", "Status", "Fit score", "Applied", ""].map((h) => (
                  <th key={h} className="admin-table__head-cell">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const badgeClass = STATUS_BADGE_CLASS[a.status] ?? "admin-badge--muted";
                return (
                  <tr key={a.id} className="admin-table__row">
                    <td className="admin-table__cell admin-table__cell--primary">{a.applicantName || "—"}</td>
                    <td className="admin-table__cell admin-table__cell--reason">{a.applicantEmail || "—"}</td>
                    <td className="admin-table__cell admin-table__cell--balance">{a.jobTitle}</td>
                    <td className="admin-table__cell admin-table__cell--reason">{a.company}</td>
                    <td className="admin-table__cell">
                      <span className={`admin-badge ${badgeClass}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="admin-table__cell admin-table__cell--balance">
                      {a.fitScore !== null ? `${a.fitScore}%` : "—"}
                    </td>
                    <td className="admin-table__cell admin-table__cell--date">{a.appliedAt}</td>
                    <td className="admin-table__cell">
                      {confirmId === a.id ? (
                        <div className="admin-actions admin-actions--compact">
                          <button
                            type="button"
                            onClick={() => void remove(a.id)}
                            disabled={deletingId === a.id}
                            className="admin-button admin-button--confirm-compact"
                          >
                            {deletingId === a.id ? "…" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmId(null)}
                            className="admin-button admin-button--cancel-compact"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(a.id)}
                          className="admin-button admin-button--danger-compact"
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

      {nextPageToken ? (
        <button
          type="button"
          onClick={() => void loadPage(nextPageToken)}
          disabled={loadingMore}
          className="admin-button admin-button--load-more"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </section>
  );
}
