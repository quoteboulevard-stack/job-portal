import { useCallback, useEffect, useState } from "react";
import { fetchJobsPage } from "../services/jobService";
import type { JobRecord } from "../types";

export function useJobs() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    fetchJobsPage(null)
      .then(({ jobs: page, hasMore: more, lastJobId: cursor }) => {
        if (!mounted) return;
        setJobs(page);
        setHasMore(more);
        setLastJobId(cursor);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load jobs.");
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchJobsPage(lastJobId);
      setJobs((prev) => [...prev, ...result.jobs]);
      setHasMore(result.hasMore);
      setLastJobId(result.lastJobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more jobs.");
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, lastJobId, loadingMore]);

  return { jobs, loading, loadingMore, hasMore, loadMore, error };
}
