import { useEffect, useState } from "react";
import { fetchJobById } from "../services/jobService";
import type { JobRecord } from "../types";

export function useJobDetail(jobId: string | undefined) {
  const [job, setJob] = useState<JobRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setLoading(false);
      setError("Job not found.");
      return;
    }

    let mounted = true;
    setLoading(true);

    fetchJobById(jobId)
      .then((data) => {
        if (!mounted) return;
        setJob(data);
        setError(data ? null : "Job not found.");
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load job.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [jobId]);

  return { job, loading, error };
}
