import { useEffect, useState } from "react";
import {
  deleteMessage,
  listAllMessages,
  type AdminMessageRecord,
} from "../services/adminService";
import "./AdminPages.css";

const STATUS_BADGE_CLASS: Record<string, string> = {
  waiting: "admin-badge--waiting",
  sent: "admin-badge--sent",
  seen: "admin-badge--seen",
  accepted: "admin-badge--accepted",
  rejected: "admin-badge--rejected",
  expired: "admin-badge--expired",
};

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<AdminMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadPage = (startAfter?: string) => {
    if (startAfter) setLoadingMore(true);
    else setLoading(true);
    listAllMessages({ startAfter })
      .then((result) => {
        setMessages((prev) => startAfter ? [...prev, ...result.items] : result.items);
        setNextPageToken(result.nextPageToken);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load messages."))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { void loadPage(); }, []);

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
    <section className="admin-page">
      <div className="admin-page__hero">
        <h1 className="admin-page__title">Messages</h1>
        <p className="admin-page__subtitle">
          All message requests across the platform. {!loading && `(${messages.length} total)`}
        </p>
      </div>

      {error ? (
        <div className="admin-page__error">{error}</div>
      ) : null}

      <input
        type="search"
        placeholder="Search by sender, recipient, subject, or status…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="admin-search"
      />

      {loading ? (
        <div className="admin-page__placeholder">Loading messages…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-page__placeholder">No messages found.</div>
      ) : (
        <div className="admin-page__list">
          {filtered.map((m) => {
            const badgeClass = STATUS_BADGE_CLASS[m.status] ?? "admin-badge--expired";
            return (
              <article key={m.id} className="admin-card admin-card--compact">
                <div className="admin-card__row admin-card__row--compact">
                  <div className="admin-card__details">
                    <strong>{m.subject || "No subject"}</strong>
                    <span className="admin-card__meta">
                      From: <b>{m.fromName || "—"}</b> → To: <b>{m.toName || "—"}</b>
                    </span>
                    <span className="admin-card__submeta">
                      {m.createdAt} · {m.creditCost} credit{m.creditCost !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="admin-actions">
                    <span className={`admin-badge ${badgeClass}`}>
                      {m.status}
                    </span>
                    {confirmId === m.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void remove(m.id)}
                          disabled={deletingId === m.id}
                          className="admin-button admin-button--confirm-compact"
                        >
                          {deletingId === m.id ? "…" : "Confirm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="admin-button admin-button--cancel-compact"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(m.id)}
                        className="admin-button admin-button--danger-compact"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                {m.body ? (
                  <p className="admin-card__body">
                    {m.body.length > 200 ? `${m.body.slice(0, 200)}…` : m.body}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {nextPageToken ? (
        <button
          type="button"
          onClick={() => void loadPage(nextPageToken)}
          disabled={loadingMore}
          className="admin-button admin-button--load-more"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </section>
  );
}
