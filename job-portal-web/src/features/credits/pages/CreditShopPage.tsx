import { useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import CreditCounter from "../components/CreditCounter";
import { useCredits } from "../hooks/useCredits";

export default function CreditShopPage() {
  const { user } = useAuth();
  const { summary, loading, error, packages, buy } = useCredits(user?.uid);
  const [status, setStatus] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const purchase = async (packageId: string) => {
    const selected = packages.find((item) => item.id === packageId);
    if (!selected) return;

    try {
      setBuyingId(packageId);
      await buy(selected);
      setStatus(`Purchased ${selected.credits} credits.`);
    } catch (purchaseError) {
      setStatus(
        purchaseError instanceof Error
          ? purchaseError.message
          : "Failed to purchase credits."
      );
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Credit shop</h1>
          <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
            Top up credits from your real Firestore profile.
          </p>
        </div>
        <CreditCounter credits={summary.available} />
      </div>

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          Loading credit balance...
        </div>
      ) : null}
      {error && !loading ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </div>
      ) : null}
      {status ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#ECFDF5", color: "#065F46" }}>
          {status}
        </div>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        {packages.map((item) => (
          <article
            key={item.id}
            style={{
              display: "grid",
              gap: 12,
              padding: 20,
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              background: "#FFFFFF",
            }}
          >
            <strong style={{ fontSize: 20, color: "#111827" }}>{item.name}</strong>
            <span style={{ color: "#3B82F6", fontSize: 28, fontWeight: 700 }}>
              {item.credits} credits
            </span>
            <span style={{ color: "#6B7280" }}>{item.price}</span>
            <button
              type="button"
              onClick={() => void purchase(item.id)}
              disabled={buyingId === item.id}
              style={{
                padding: "12px 16px",
                border: 0,
                borderRadius: 8,
                background: "#2563EB",
                color: "#FFFFFF",
                fontWeight: 700,
                cursor: "pointer",
                opacity: buyingId === item.id ? 0.7 : 1,
              }}
            >
              {buyingId === item.id ? "Processing..." : "Buy package"}
            </button>
          </article>
        ))}
      </section>
    </section>
  );
}
