import { useEffect, useMemo, useState } from "react";
import StatCard from "../../../shared/components/StatCard";

type Stat = { label: string; value: string | number; change?: string | number; icon?: string };
type MetricItem = { label: string; value: number };
type Props = { mode?: "seeker" | "employer"; stats: Stat[]; fitScores?: MetricItem[]; skills?: MetricItem[]; funnel?: MetricItem[]; applicants?: { name: string; score: number; skills: string[] }[] };

export default function DashboardLayout({ mode = "seeker", stats, fitScores = [], skills = [], funnel = [], applicants = [] }: Props) {
  const [mobile, setMobile] = useState(typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const normalizedSkills = useMemo<MetricItem[]>(() => skills.map((item) => ({ label: item.label, value: item.value })), [skills]);
  const normalizedFunnel = useMemo<MetricItem[]>(() => funnel.map((item) => ({ label: item.label, value: item.value })), [funnel]);
  useEffect(() => { const onResize = () => setMobile(window.innerWidth < 768); window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, []);
  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {stats.map((item) => <StatCard key={item.label} {...item} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 }}>
        {mode === "seeker" ? <>
          <MetricBars title="Fit Score Histogram" items={fitScores} tone="#10B981" />
          <MetricBars title="Top Skills" items={normalizedSkills} tone="#3B82F6" />
        </> : <>
          {!mobile && <MetricBars title="Hiring Funnel" items={normalizedFunnel} tone="#3B82F6" />}
          <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}><strong style={{ display: "block", marginBottom: 12, color: "#111827" }}>Top Applicants</strong><div style={{ display: "grid", gap: 12 }}>{applicants.map((item) => <div key={item.name} style={{ display: "grid", gap: 6, paddingBottom: 12, borderBottom: "1px solid #F3F4F6" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>{item.name}</strong><span style={{ color: "#10B981", fontSize: 14 }}>{item.score}%</span></div><div style={{ fontSize: 14, color: "#6B7280" }}>{item.skills.join(", ")}</div><button type="button" style={{ justifySelf: "start" }}>Download</button></div>)}</div></div>
        </>}
      </div>
    </section>
  );
}

function MetricBars({
  title,
  items,
  tone,
}: {
  title: string;
  items: { label: string; value: number }[];
  tone: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div style={{ background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 16 }}>
      <strong style={{ display: "block", marginBottom: 12, color: "#111827" }}>{title}</strong>
      {items.length === 0 ? (
        <p style={{ margin: 0, color: "#6B7280" }}>No data available yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <div key={item.label} style={{ display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span style={{ color: "#374151" }}>{item.label}</span>
                <strong style={{ color: "#111827" }}>{item.value}</strong>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "#E5E7EB", overflow: "hidden" }}>
                <div style={{ width: `${(item.value / max) * 100}%`, height: "100%", background: tone }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
