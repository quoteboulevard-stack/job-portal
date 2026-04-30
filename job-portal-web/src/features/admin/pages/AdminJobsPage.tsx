import { useEffect, useState } from "react";
import { deleteJob, listAllJobs, type AdminJobRecord } from "../services/adminService";
import "./AdminPages.css";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<AdminJobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const loadPage = (startAfter?: string) => {
    if (startAfter) setLoadingMore(true);
    else setLoading(true);
    listAllJobs({ startAfter })
      .then((result) => {
        setJobs((prev) => startAfter ? [...prev, ...result.items] : result.items);
        setNextPageToken(result.nextPageToken);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load jobs."))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { void loadPage(); }, []);

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
    <section className="admin-page">
      <div className="admin-page__hero">
        <h1 className="admin-page__title">Jobs</h1>
        <p className="admin-page__subtitle">
          All jobs in the platform. Delete removes the listing permanently.
        </p>
      </div>

      {error ? (
        <div className="admin-page__error">{error}</div>
      ) : null}

      {loading ? (
        <div className="admin-page__placeholder">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="admin-page__placeholder">No jobs found.</div>
      ) : (
        <div className="admin-page__list">
          {jobs.map((job) => (
            <article key={job.id} className="admin-card">
              <div className="admin-card__row">
                <div>
                  <h3 className="admin-card__title">{job.title}</h3>
                  <p className="admin-card__meta">
                    {job.company} · {job.location}
                  </p>
                  <p className="admin-card__submeta">
                    Posted {job.createdAt} · Employer ID: {job.employerId}
                  </p>
                </div>
                <div className="admin-actions">
                  <span className={`admin-badge ${job.status === "open" ? "admin-badge--open" : "admin-badge--muted"}`}>
                    {job.status}
                  </span>
                  {confirmId === job.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void remove(job.id)}
                        disabled={deletingId === job.id}
                        className="admin-button admin-button--confirm"
                      >
                        {deletingId === job.id ? "Deleting..." : "Confirm delete"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="admin-button admin-button--cancel"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(job.id)}
                      className="admin-button admin-button--danger"
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
