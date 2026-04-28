import { useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import ApplicationsList from "../components/ApplicationsList";
import { useApplications } from "../hooks/useApplications";

export default function ApplicationTrackerPage() {
  const { user } = useAuth();
  const { applications, loading, error } = useApplications(user?.uid);
  const [filter, setFilter] = useState("All");

  const filtered = useMemo(() => {
    return applications.filter(
      (item) =>
        filter === "All" ||
        item.status.toLowerCase() === filter.toLowerCase().replace("offers", "offer")
    );
  }, [applications, filter]);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      {loading ? (
        <div style={{ margin: 16, padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          Loading applications...
        </div>
      ) : null}
      {error && !loading ? (
        <div style={{ margin: 16, padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </div>
      ) : null}
      {!loading ? (
        <ApplicationsList applications={filtered} filter={filter} onFilter={setFilter} />
      ) : null}
    </section>
  );
}
