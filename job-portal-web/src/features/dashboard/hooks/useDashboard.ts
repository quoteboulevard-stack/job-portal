import { useEffect, useState } from "react";
import {
  getEmployerDashboard,
  getJobSeekerDashboard,
} from "../services/dashboardService";
import type { EmployerDashboardData, JobSeekerDashboardData } from "../types";

type DashboardMode = "job_seeker" | "employer";

export function useDashboard(userId: string | undefined, mode: DashboardMode) {
  const [data, setData] = useState<JobSeekerDashboardData | EmployerDashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setData(null);
      setLoading(false);
      setError("Sign in to view the dashboard.");
      return;
    }

    let mounted = true;
    setLoading(true);

    const task =
      mode === "employer"
        ? getEmployerDashboard(userId)
        : getJobSeekerDashboard(userId);

    task
      .then((result) => {
        if (!mounted) return;
        setData(result);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [mode, userId]);

  return { data, loading, error };
}
