import { useEffect, useMemo, useState } from "react";
import ApplicationCard from "./ApplicationCard";
import StatusTimeline from "./StatusTimeline";

type Status = "applied" | "shortlisted" | "interview" | "offer" | "rejected";
type App = { jobTitle: string; company: string; status: Status; appliedDate: string; fitScore?: number };
type Props = { applications: App[]; filter: string; onFilter: (value: string) => void };
const filters = ["All", "Applied", "Shortlisted", "Interview", "Offers", "Rejected"];

export default function ApplicationsList({ applications, filter, onFilter }: Props) {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => { const onResize = () => setMobile(window.innerWidth < 768); window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);
  const stats = useMemo(() => ({ total: applications.length, shortlisted: applications.filter((a) => a.status === "shortlisted").length, offers: applications.filter((a) => a.status === "offer").length }), [applications]);
  const data = useMemo(() => (["applied", "shortlisted", "interview", "offer", "rejected"] as Status[]).map((status) => ({ name: status, value: applications.filter((a) => a.status === status).length })), [applications]);
  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{filters.map((item) => <button key={item} type="button" onClick={() => onFilter(item)} aria-pressed={filter === item}>{item}</button>)}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>{[{ label: "Total", value: stats.total }, { label: "Shortlisted", value: stats.shortlisted }, { label: "Offers", value: stats.offers }].map((item) => <div key={item.label} style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}><strong style={{ display: "block", fontSize: 24 }}>{item.value}</strong><span style={{ color: "#6B7280", fontSize: 14 }}>{item.label}</span></div>)}</div>
      <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, display: "grid", gap: 12 }}>
        <strong style={{ color: "#111827" }}>Pipeline breakdown</strong>
        {data.map((entry) => {
          const max = Math.max(...data.map((item) => item.value), 1);
          const width = `${(entry.value / max) * 100}%`;
          return (
            <div key={entry.name} style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ textTransform: "capitalize", color: "#374151" }}>{entry.name}</span>
                <strong style={{ color: "#111827" }}>{entry.value}</strong>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "#E5E7EB", overflow: "hidden" }}>
                <div style={{ width, height: "100%", background: "#3B82F6" }} />
              </div>
            </div>
          );
        })}
      </div>
      {!applications.length ? <div style={{ minHeight: 220, display: "grid", placeItems: "center", border: "1px solid #E5E7EB", borderRadius: 8, color: "#6B7280" }}>No applications found.</div> : <div style={{ display: "grid", gap: 12 }}>{applications.map((application) => <div key={`${application.jobTitle}-${application.company}`} style={{ display: "grid", gap: 10 }}><ApplicationCard application={application} /><StatusTimeline currentStep={application.status === "applied" ? "Applied" : application.status === "shortlisted" ? "Shortlisted" : application.status === "interview" ? "Interview" : application.status === "offer" ? "Offer" : "Applied"} dates={{ Applied: application.appliedDate, Shortlisted: application.status !== "applied" && application.status !== "rejected" ? application.appliedDate : undefined, Interview: application.status === "interview" || application.status === "offer" ? application.appliedDate : undefined, Offer: application.status === "offer" ? application.appliedDate : undefined }} orientation={mobile ? "vertical" : "horizontal"} /></div>)}</div>}
    </section>
  );
}
