type Props = { name: string; title: string; location: string; avatar?: string; onEdit?: () => void };

export default function ProfileCard({ name, title, location, avatar, onEdit }: Props) {
  return (
    <section style={{ display: "flex", gap: 16, alignItems: "center", padding: 16, borderRadius: 8, border: "1px solid rgba(229,231,235,0.9)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}>
      {avatar ? <img src={avatar} alt={`${name} avatar`} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} /> : <div aria-label="Profile avatar" style={{ width: 64, height: 64, borderRadius: "50%", background: "#DBEAFE", display: "grid", placeItems: "center", color: "#1D4ED8", fontSize: 24, fontWeight: 700 }}>{name.charAt(0)}</div>}
      <div style={{ flex: 1 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{name}</h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B7280" }}>{title}</p>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "#6B7280" }}>{location}</p>
      </div>
      <button type="button" onClick={onEdit} style={{ padding: "8px 12px", border: 0, borderRadius: 8, background: "#3B82F6", color: "#FFF", fontSize: 14, fontWeight: 600 }}>
        Edit
      </button>
    </section>
  );
}
