type Props = { credits: number; onClick?: () => void };

export default function CreditCounter({ credits, onClick }: Props) {
  const color = credits >= 5 ? "#10B981" : credits > 0 ? "#F59E0B" : "#EF4444";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Credits: ${credits} available`}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", marginLeft: "auto", padding: "8px 12px",
        border: `1px solid ${color}`, borderRadius: 8, background: "#FFF", color, fontSize: 14, fontWeight: 700, cursor: "pointer",
      }}
    >
      Credits: {credits} available
    </button>
  );
}
