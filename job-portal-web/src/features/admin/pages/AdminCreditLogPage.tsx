import { useEffect, useState } from "react";
import { listAllCreditTransactions, type AdminCreditTransaction } from "../services/adminService";
import "./AdminPages.css";

const TYPE_BADGE_CLASS: Record<string, string> = {
  topup: "admin-badge--topup",
  deduction: "admin-badge--deduction",
  refund: "admin-badge--refund",
};

export default function AdminCreditLogPage() {
  const [transactions, setTransactions] = useState<AdminCreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadPage = (startAfter?: string) => {
    if (startAfter) setLoadingMore(true);
    else setLoading(true);
    listAllCreditTransactions({ startAfter })
      .then((result) => {
        setTransactions((prev) => startAfter ? [...prev, ...result.items] : result.items);
        setNextPageToken(result.nextPageToken);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load transactions."))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { void loadPage(); }, []);

  const filtered = transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      t.userId.toLowerCase().includes(q) ||
      t.reason.toLowerCase().includes(q) ||
      t.type.toLowerCase().includes(q);
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalTopup = transactions
    .filter((t) => t.type === "topup")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalDeducted = transactions
    .filter((t) => t.type === "deduction")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRefunded = transactions
    .filter((t) => t.type === "refund")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <section className="admin-page">
      <div className="admin-page__hero">
        <h1 className="admin-page__title">Credit log</h1>
        <p className="admin-page__subtitle">
          Full audit trail of all credit transactions across all users.
          {!loading && ` (${transactions.length} total)`}
        </p>
      </div>

      {error ? (
        <div className="admin-page__error">{error}</div>
      ) : null}

      {!loading && (
        <div className="admin-page__stats">
          {[
            { label: "Total topped up", value: totalTopup, valueClass: "admin-stat-card__value--positive" },
            { label: "Total deducted", value: totalDeducted, valueClass: "admin-stat-card__value--negative" },
            { label: "Total refunded", value: totalRefunded, valueClass: "admin-stat-card__value--info" },
          ].map((s) => (
            <div key={s.label} className="admin-stat-card">
              <span className="admin-stat-card__label">{s.label}</span>
              <span className={`admin-stat-card__value ${s.valueClass}`}>{s.value}</span>
              <span className="admin-stat-card__suffix">credits</span>
            </div>
          ))}
        </div>
      )}

      <div className="admin-filters">
        <input
          type="search"
          placeholder="Search by user ID or reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search admin-search--flex"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="admin-select"
          aria-label="Filter credit transactions by type"
        >
          <option value="all">All types</option>
          <option value="topup">Top-up</option>
          <option value="deduction">Deduction</option>
          <option value="refund">Refund</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-page__placeholder">Loading transactions…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-page__placeholder">
          No transactions found.{" "}
          {transactions.length === 0
            ? "Transactions are stored in users/{uid}/credit_transactions — they appear here once credits are purchased or deducted."
            : "Try clearing the search filter."}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr className="admin-table__head-row">
                {["Date", "User ID", "Type", "Amount", "Balance after", "Reason"].map((h) => (
                  <th key={h} className="admin-table__head-cell">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const badgeClass = TYPE_BADGE_CLASS[t.type] ?? "admin-badge--muted";
                const sign = t.type === "topup" || t.type === "refund" ? "+" : "−";
                return (
                  <tr key={`${t.userId}-${t.id}-${i}`} className="admin-table__row">
                    <td className="admin-table__cell admin-table__cell--date">{t.date}</td>
                    <td className="admin-table__cell admin-table__cell--mono">
                      {t.userId.slice(0, 10)}…
                    </td>
                    <td className="admin-table__cell">
                      <span className={`admin-badge ${badgeClass}`}>
                        {t.type}
                      </span>
                    </td>
                    <td
                      className={`admin-table__cell admin-table__cell--amount ${
                        t.type === "deduction"
                          ? "admin-table__cell--amount-negative"
                          : "admin-table__cell--amount-positive"
                      }`}
                    >
                      {sign}{t.amount}
                    </td>
                    <td className="admin-table__cell admin-table__cell--balance">{t.balanceAfter}</td>
                    <td className="admin-table__cell admin-table__cell--reason">{t.reason || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
