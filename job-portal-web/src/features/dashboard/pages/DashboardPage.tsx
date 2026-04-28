import { useAuth } from "../../auth/hooks/useAuth";
import DashboardLayout from "../components/DashboardLayout";
import { useDashboard } from "../hooks/useDashboard";
import type { JobSeekerDashboardData } from "../types";

const emptyData: JobSeekerDashboardData = {
  stats: [
    { label: "Applications", value: 0, icon: "work" },
    { label: "In Progress", value: 0, icon: "schedule" },
    { label: "Profile Views", value: 0, icon: "visibility" },
    { label: "Offers", value: 0, icon: "verified" },
  ],
  fitScores: [],
  skills: [],
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboard(user?.uid, "job_seeker");

  if (loading) {
    return <DashboardState message="Loading your dashboard..." />;
  }

  if (error) {
    return <DashboardState message={error} tone="error" />;
  }

  const dashboard = (data as JobSeekerDashboardData | null) ?? emptyData;
  return (
    <DashboardLayout
      stats={dashboard.stats}
      fitScores={dashboard.fitScores}
      skills={dashboard.skills}
    />
  );
}

function DashboardState({
  message,
  tone = "neutral",
}: {
  message: string;
  tone?: "neutral" | "error";
}) {
  return (
    <section style={{ padding: 16 }}>
      <div
        style={{
          padding: 24,
          borderRadius: 12,
          background: tone === "error" ? "#FEF2F2" : "#FFFFFF",
          border: "1px solid #E5E7EB",
          color: tone === "error" ? "#B91C1C" : "#111827",
        }}
      >
        {message}
      </div>
    </section>
  );
}
