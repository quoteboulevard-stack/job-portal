type Props = { label: string; value: string | number; change?: string | number; icon?: string };
const iconStyle = { fontFamily: '"Material Symbols Outlined","Material Icons",sans-serif', fontSize: 20, lineHeight: 1 };

export default function StatCard({ label, value, change, icon }: Props) {
  const negative = typeof change === "string" ? change.trim().startsWith("-") : typeof change === "number" ? change < 0 : false;
  return (
    <section style={{ display: "grid", gap: 8, padding: 16, background: "#FFF", border: "1px solid #E5E7EB", borderRadius: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: 14, color: "#6B7280" }}>{label}</span>
        {icon && <span aria-hidden="true" style={iconStyle}>{icon}</span>}
      </div>
      <strong style={{ fontSize: 24, fontWeight: 700, color: "#3B82F6" }}>{value}</strong>
      {change !== undefined && <span style={{ fontSize: 14, color: negative ? "#EF4444" : "#10B981" }}>{change}</span>}
    </section>
  );
}
