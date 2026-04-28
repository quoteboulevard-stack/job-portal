import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAdminStats, type AdminStats } from "../services/adminService";

const cardStyle = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 12,
  padding: 24,
};

const statCardStyle = {
  ...cardStyle,
  display: "grid",
  gap: 8,
};

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
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={cardStyle}>
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Admin dashboard</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          Platform-wide overview. Manage users and jobs from the links below.
        </p>
      </div>

      {error ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle}>Loading stats...</div>
      ) : stats ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
          {[
            { label: "Users", value: stats.totalUsers, to: "/admin/users" },
            { label: "Jobs", value: stats.totalJobs, to: "/admin/jobs" },
            { label: "Applications", value: stats.totalApplications, to: "/admin/applications" },
            { label: "Messages", value: stats.totalMessages, to: "/admin/messages" },
          ].map((item) => (
            <article key={item.label} style={statCardStyle}>
              <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>
                {item.label}
              </span>
              <span style={{ fontSize: 40, fontWeight: 700, color: "#111827" }}>
                {item.value}
              </span>
              {item.to ? (
                <Link to={item.to} style={{ fontSize: 14, color: "#2563EB" }}>
                  Manage →
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          to="/admin/users"
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            background: "#2563EB",
            color: "#FFFFFF",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Manage users
        </Link>
        <Link
          to="/admin/jobs"
          style={{
            padding: "12px 20px",
            borderRadius: 8,
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            color: "#111827",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Manage jobs
        </Link>
      </nav>
    </section>
  );
}
