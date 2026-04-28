import { useEffect, useState } from "react";
import { listAllCreditTransactions, type AdminCreditTransaction } from "../services/adminService";

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  topup:     { bg: "#F0FDF4", color: "#166534" },
  deduction: { bg: "#FEF2F2", color: "#B91C1C" },
  refund:    { bg: "#EFF6FF", color: "#1D4ED8" },
};

export default function AdminCreditLogPage() {
  const [transactions, setTransactions] = useState<AdminCreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    listAllCreditTransactions()
      .then(setTransactions)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load transactions."))
      .finally(() => setLoading(false));
  }, []);

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
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Credit log</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          Full audit trail of all credit transactions across all users.
          {!loading && ` (${transactions.length} total)`}
        </p>
      </div>

      {error ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>{error}</div>
      ) : null}

      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16 }}>
          {[
            { label: "Total topped up", value: totalTopup, color: "#166534" },
            { label: "Total deducted", value: totalDeducted, color: "#B91C1C" },
            { label: "Total refunded", value: totalRefunded, color: "#1D4ED8" },
          ].map((s) => (
            <div key={s.label} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, padding: 20, display: "grid", gap: 4 }}>
              <span style={{ fontSize: 13, color: "#6B7280", fontWeight: 700 }}>{s.label}</span>
              <span style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>credits</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          type="search"
          placeholder="Search by user ID or reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14 }}
        >
          <option value="all">All types</option>
          <option value="topup">Top-up</option>
          <option value="deduction">Deduction</option>
          <option value="refund">Refund</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>Loading transactions…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          No transactions found.{" "}
          {transactions.length === 0
            ? "Transactions are stored in users/{uid}/credit_transactions — they appear here once credits are purchased or deducted."
            : "Try clearing the search filter."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Date", "User ID", "Type", "Amount", "Balance after", "Reason"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#6B7280", fontWeight: 700, borderBottom: "1px solid #E5E7EB" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const badge = TYPE_COLORS[t.type] ?? { bg: "#F3F4F6", color: "#6B7280" };
                const sign = t.type === "topup" || t.type === "refund" ? "+" : "−";
                return (
                  <tr key={`${t.userId}-${t.id}-${i}`} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 14, whiteSpace: "nowrap" }}>{t.date}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#9CA3AF", fontFamily: "monospace" }}>
                      {t.userId.slice(0, 10)}…
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "2px 10px", borderRadius: 99, fontSize: 13, fontWeight: 700, background: badge.bg, color: badge.color }}>
                        {t.type}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 700, color: t.type === "deduction" ? "#B91C1C" : "#166534" }}>
                      {sign}{t.amount}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#111827" }}>{t.balanceAfter}</td>
                    <td style={{ padding: "12px 16px", color: "#374151", fontSize: 14 }}>{t.reason || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
