import { useEffect, useState } from "react";
import {
  deleteMessage,
  listAllMessages,
  type AdminMessageRecord,
} from "../services/adminService";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  waiting:  { bg: "#EFF6FF", color: "#1D4ED8" },
  sent:     { bg: "#DBEAFE", color: "#1D4ED8" },
  seen:     { bg: "#FEF3C7", color: "#92400E" },
  accepted: { bg: "#F0FDF4", color: "#166534" },
  rejected: { bg: "#FEF2F2", color: "#B91C1C" },
  expired:  { bg: "#F3F4F6", color: "#6B7280" },
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<AdminMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listAllMessages()
      .then(setMessages)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load messages."))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id: string) => {
    try {
      setDeletingId(id);
      await deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete message.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = messages.filter((m) => {
    const q = search.toLowerCase();
    return (
      !q ||
      m.fromName.toLowerCase().includes(q) ||
      m.toName.toLowerCase().includes(q) ||
      m.subject.toLowerCase().includes(q) ||
      m.status.toLowerCase().includes(q)
    );
  });

  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Messages</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          All message requests across the platform. {!loading && `(${messages.length} total)`}
        </p>
      </div>

      {error ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>{error}</div>
      ) : null}

      <input
        type="search"
        placeholder="Search by sender, recipient, subject, or status…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }}
      />

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>Loading messages…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>No messages found.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((m) => {
            const badge = STATUS_COLORS[m.status] ?? { bg: "#F3F4F6", color: "#6B7280" };
            return (
              <article
                key={m.id}
                style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, display: "grid", gap: 10 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong style={{ color: "#111827" }}>{m.subject || "No subject"}</strong>
                    <span style={{ fontSize: 14, color: "#6B7280" }}>
                      From: <b>{m.fromName || "—"}</b> → To: <b>{m.toName || "—"}</b>
                    </span>
                    <span style={{ fontSize: 13, color: "#9CA3AF" }}>
                      {m.createdAt} · {m.creditCost} credit{m.creditCost !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 13, fontWeight: 700, background: badge.bg, color: badge.color }}>
                      {m.status}
                    </span>
                    {confirmId === m.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void remove(m.id)}
                          disabled={deletingId === m.id}
                          style={{ padding: "4px 12px", border: 0, borderRadius: 6, background: "#DC2626", color: "#FFF", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                        >
                          {deletingId === m.id ? "…" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          style={{ padding: "4px 12px", border: "1px solid #E5E7EB", borderRadius: 6, background: "#FFF", color: "#374151", fontSize: 13, cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(m.id)}
                        style={{ padding: "4px 12px", border: "1px solid #FECACA", borderRadius: 6, background: "#FEF2F2", color: "#B91C1C", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {m.body ? (
                  <p style={{ margin: 0, color: "#374151", fontSize: 14, borderTop: "1px solid #F3F4F6", paddingTop: 10 }}>
                    {m.body.length > 200 ? `${m.body.slice(0, 200)}…` : m.body}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
