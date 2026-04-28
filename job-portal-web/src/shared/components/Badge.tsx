type Props = { text: string; variant?: "blue" | "gray" | "green" | "red"; onClick?: () => void; removable?: boolean };

const tones = { blue: "#3B82F6", gray: "#6B7280", green: "#10B981", red: "#EF4444" };
const style = (variant: keyof typeof tones, interactive: boolean) => ({
  display: "inline-flex", alignItems: "center", gap: 4, padding: 4, border: 0, borderRadius: 6,
  background: tones[variant], color: "#FFFFFF", fontSize: 12, fontWeight: 700, lineHeight: 1, cursor: interactive ? "pointer" : "default",
});

export default function Badge({ text, variant = "blue", onClick, removable = false }: Props) {
  const interactive = removable || !!onClick;
  const className = `${interactive ? (removable ? "badge-removable" : "badge-action") : "badge-static"} badge-${variant}`;
  if (!interactive) return <span className={className} style={style(variant, false)}>{text}</span>;
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={`${removable ? "Remove" : "Add"} ${text}${removable ? " skill" : ""}`}
      style={style(variant, true)}
    >
      <span>{text}</span>
      {removable && <span aria-hidden="true">x</span>}
    </button>
  );
}
