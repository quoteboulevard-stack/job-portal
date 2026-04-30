import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, type AdminStats } from "../services/adminService";
import "./AdminPages.css";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load stats."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="admin-page">
      <div className="admin-page__hero">
        <h1 className="admin-page__title">Admin dashboard</h1>
        <p className="admin-page__subtitle">
          Platform-wide overview. Manage users and jobs from the links below.
        </p>
      </div>

      {error ? (
        <div className="admin-page__error">{error}</div>
      ) : null}

      {loading ? (
        <div className="admin-page__placeholder">Loading stats...</div>
      ) : stats ? (
        <div className="admin-page__stats">
          {[
            { label: "Users", value: stats.totalUsers, to: "/admin/users" },
            { label: "Jobs", value: stats.totalJobs, to: "/admin/jobs" },
            { label: "Applications", value: stats.totalApplications, to: "/admin/applications" },
            { label: "Messages", value: stats.totalMessages, to: "/admin/messages" },
          ].map((item) => (
            <article key={item.label} className="admin-stat-card">
              <span className="admin-stat-card__label">
                {item.label}
              </span>
              <span className="admin-stat-card__value admin-stat-card__value--dashboard">
                {item.value}
              </span>
              {item.to ? (
                <Link to={item.to} className="admin-link admin-link--primary">
                  Manage →
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <nav className="admin-nav">
        <Link
          to="/admin/users"
          className="admin-link-button admin-link-button--solid"
        >
          Manage users
        </Link>
        <Link
          to="/admin/jobs"
          className="admin-link-button admin-link-button--outline"
        >
          Manage jobs
        </Link>
      </nav>
    </section>
  );
}
