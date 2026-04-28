import { useEffect, useState } from "react";
import { listApplicationsForUser } from "../services/applicationService";
import type { ApplicationRecord } from "../types";

export function useApplications(userId: string | undefined) {
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setApplications([]);
      setLoading(false);
      setError("Sign in to view your applications.");
      return;
    }

    let mounted = true;
    setLoading(true);

    listApplicationsForUser(userId)
      .then((data) => {
        if (!mounted) return;
        setApplications(data);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load applications.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { applications, loading, error };
}
