import { useEffect, useState } from "react";
import {
  creditPackages,
  fetchCreditSummary,
  purchaseCredits,
} from "../services/creditService";
import type { CreditPackageRecord, CreditSummary } from "../types";

export function useCredits(userId: string | undefined) {
  const [summary, setSummary] = useState<CreditSummary>({
    available: 0,
    totalAdded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    if (!userId) {
      setLoading(false);
      setError("Sign in to manage credits.");
      return Promise.resolve();
    }

    setLoading(true);
    return fetchCreditSummary(userId)
      .then((data) => {
        setSummary(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load credits.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void reload();
  }, [userId]);

  const buy = async (selectedPackage: CreditPackageRecord) => {
    if (!userId) {
      throw new Error("Sign in to purchase credits.");
    }
    await purchaseCredits(userId, selectedPackage);
    await reload();
  };

  return { summary, loading, error, packages: creditPackages, buy };
}
