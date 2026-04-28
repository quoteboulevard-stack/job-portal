import { useEffect, useState } from "react";

type Props = { message: string; type?: "success" | "error" | "warning" | "info"; duration?: number };
const tones = { success: "#10B981", error: "#EF4444", warning: "#F59E0B", info: "#3B82F6" };

export default function Toast({ message, type = "info", duration = 3000 }: Props) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(hide);
  }, [message, duration]);
  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed", right: 16, bottom: 16, maxWidth: 360, padding: "12px 16px", borderRadius: 8,
        background: "#FFF", border: `1px solid ${tones[type]}`, color: tones[type], boxShadow: "0 8px 24px rgba(17,24,39,0.12)",
        opacity: visible ? 1 : 0, transition: "opacity 160ms ease",
      }}
    >
      {message}
    </div>
  );
}
