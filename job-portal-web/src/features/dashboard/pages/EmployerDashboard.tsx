import { useAuth } from "../../auth/hooks/useAuth";
import DashboardLayout from "../components/DashboardLayout";
import { useDashboard } from "../hooks/useDashboard";
import type { EmployerDashboardData } from "../types";

const emptyData: EmployerDashboardData = {
  stats: [
    { label: "Active Jobs", value: 0, icon: "work" },
    { label: "Applicants", value: 0, icon: "groups" },
    { label: "Shortlisted", value: 0, icon: "checklist" },
    { label: "Avg Quality", value: "0%", icon: "insights" },
  ],
  funnel: [],
  applicants: [],
};

export default function EmployerDashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useDashboard(user?.uid, "employer");

  if (loading) {
    return <DashboardState message="Loading employer dashboard..." />;
  }

  if (error) {
    return <DashboardState message={error} tone="error" />;
  }

  const dashboard = (data as EmployerDashboardData | null) ?? emptyData;
  return (
    <DashboardLayout
      mode="employer"
      stats={dashboard.stats}
      funnel={dashboard.funnel}
      applicants={dashboard.applicants}
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
