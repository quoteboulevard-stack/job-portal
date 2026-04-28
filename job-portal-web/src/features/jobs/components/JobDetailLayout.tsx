import { useEffect, useState } from "react";
import Badge from "../../../shared/components/Badge";
import Button from "../../../shared/components/Button";

type Job = { title: string; company: string; salary?: string; description: string; requirements: string[]; experience: string; perks?: string[]; fitScore?: number };
type Props = {
  job: Job;
  isJobSeeker?: boolean;
  onApply?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  primaryActionLabel?: string;
};

export default function JobDetailLayout({
  job,
  isJobSeeker = false,
  onApply,
  onSave,
  onShare,
  primaryActionLabel = "Apply Now",
}: Props) {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const actions = (
    <aside style={{ position: mobile ? "sticky" : "sticky", bottom: mobile ? 0 : "auto", top: mobile ? "auto" : 96, display: "grid", gap: 12, padding: 16, background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8 }}>
      {isJobSeeker && typeof job.fitScore === "number" && (
        <div style={{ display: "grid", gap: 6 }}>
          <strong style={{ fontSize: 14, color: "#059669" }}>Fit Score {job.fitScore}%</strong>
          <div style={{ height: 8, borderRadius: 999, background: "#D1FAE5", overflow: "hidden" }}><div style={{ width: `${job.fitScore}%`, height: "100%", background: "#10B981" }} /></div>
        </div>
      )}
      <Button variant="success" fullWidth ariaLabel={primaryActionLabel} onClick={onApply}>
        {primaryActionLabel}
      </Button>
      <button type="button" onClick={onSave} style={{ padding: "10px 16px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFF", color: "#6B7280" }}>Save Job</button>
      <button type="button" onClick={onShare} style={{ padding: "10px 16px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFF", color: "#6B7280" }}>Share</button>
    </aside>
  );
  return (
    <section style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "minmax(0,1fr) 320px", gap: 16, padding: 16, paddingBottom: mobile ? 120 : 16 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <header style={{ position: "sticky", top: 0, zIndex: 20, padding: 16, background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8 }}>
          <h1 style={{ margin: 0, fontSize: 24, color: "#111827" }}>{job.title}</h1>
          <p style={{ margin: "6px 0 0", fontSize: 16, color: "#6B7280" }}>{job.company}</p>
          {job.salary && <p style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 600, color: "#111827" }}>{job.salary}</p>}
        </header>
        <section style={{ display: "grid", gap: 8 }}><h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>About role</h2><p style={{ margin: 0, lineHeight: 1.6, color: "#374151" }}>{job.description}</p></section>
        <section style={{ display: "grid", gap: 8 }}><h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>Requirements</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{job.requirements.map((item) => <Badge key={item} text={item} variant="blue" />)}</div></section>
        <section style={{ display: "grid", gap: 8 }}><h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>Experience needed</h2><p style={{ margin: 0, color: "#374151" }}>{job.experience}</p></section>
        {!!job.perks?.length && <section style={{ display: "grid", gap: 8 }}><h2 style={{ margin: 0, fontSize: 18, color: "#111827" }}>Perks</h2><div style={{ display: "grid", gap: 6 }}>{job.perks.map((item) => <div key={item} style={{ display: "flex", gap: 8, alignItems: "center", color: "#059669" }}><span aria-hidden="true">check_circle</span><span>{item}</span></div>)}</div></section>}
      </div>
      {mobile ? <div style={{ position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 30 }}>{actions}</div> : actions}
    </section>
  );
}
