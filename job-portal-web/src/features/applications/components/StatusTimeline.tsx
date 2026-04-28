type Step = "Applied" | "Shortlisted" | "Interview" | "Offer";
type Props = { currentStep: Step; dates: Partial<Record<Step, string>>; orientation?: "vertical" | "horizontal" };
const steps: Step[] = ["Applied", "Shortlisted", "Interview", "Offer"];

export default function StatusTimeline({ currentStep, dates, orientation = "vertical" }: Props) {
  const current = steps.indexOf(currentStep);
  return (
    <div style={{ display: "flex", flexDirection: orientation === "horizontal" ? "row" : "column", gap: 12 }}>
      {steps.map((step, index) => {
        const done = index < current, active = index === current;
        return (
          <div key={step} style={{ display: "flex", flexDirection: orientation === "horizontal" ? "column" : "row", gap: 8, alignItems: orientation === "horizontal" ? "center" : "flex-start", minWidth: 88 }}>
            <div style={{ display: "grid", placeItems: "center", width: 24, height: 24, borderRadius: "50%", border: `2px solid ${done || active ? "#10B981" : "#D1D5DB"}`, background: active ? "#10B981" : "#FFF", color: done || active ? "#FFF" : "#9CA3AF", fontSize: 12, fontWeight: 700 }}>
              {done ? "\u2713" : active ? "\u2022" : ""}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: active ? 700 : 600, color: done || active ? "#059669" : "#6B7280" }}>{step}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>{dates[step] || "Pending"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
