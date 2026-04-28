import { CSSProperties } from "react";

type Props = { children: React.ReactNode; className?: string; clickable?: boolean; onClick?: () => void; variant?: "default" | "highlighted" | "success" };

const tones = { default: "#FFFFFF", highlighted: "#EFF6FF", success: "#ECFDF5" };

export default function Card({ children, className = "", clickable = false, onClick, variant = "default" }: Props) {
  const style: CSSProperties = {
    background: tones[variant], border: "1px solid #E5E7EB", borderRadius: 8, padding: 16, boxShadow: "none",
    transition: "box-shadow 120ms ease", cursor: clickable ? "pointer" : "default",
  };
  return (
    <div
      className={className}
      onClick={clickable ? onClick : undefined}
      onKeyDown={(e) => { if (clickable && (e.key === "Enter" || e.key === " ")) onClick?.(); }}
      onMouseEnter={(e) => { if (clickable) e.currentTarget.style.boxShadow = "0 2px 8px rgba(17,24,39,0.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      style={style}
    >
      {children}
    </div>
  );
}
