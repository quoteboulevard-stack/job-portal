import { useState } from "react";

type Status = "applied" | "shortlisted" | "interview" | "offer" | "rejected";
type Props = { application: { jobTitle: string; company: string; status: Status; appliedDate: string; fitScore?: number }; onClick?: () => void };
const tones: Record<Status, string> = { applied: "#3B82F6", shortlisted: "#F59E0B", interview: "#8B5CF6", offer: "#10B981", rejected: "#EF4444" };

export default function ApplicationCard({ application, onClick }: Props) {
  const [hover, setHover] = useState(false);
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick?.(); }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, cursor: "pointer", boxShadow: hover ? "0 4px 12px rgba(17,24,39,0.08)" : "none" }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{application.jobTitle}</h3>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B7280" }}>{application.company}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ display: "inline-flex", padding: 4, borderRadius: 6, background: tones[application.status], color: "#FFF", fontSize: 12, fontWeight: 700 }}>{application.status}</span>
          <span style={{ fontSize: 12, color: "#6B7280" }}>{application.appliedDate}</span>
        </div>
        {typeof application.fitScore === "number" && (
          <div style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, color: "#059669", fontWeight: 600 }}>Fit Score {application.fitScore}%</span>
            <div style={{ height: 8, borderRadius: 999, background: "#D1FAE5", overflow: "hidden" }}><div style={{ width: `${application.fitScore}%`, height: "100%", background: "#10B981" }} /></div>
          </div>
        )}
      </div>
    </article>
  );
}
