import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setStatus(null);
      await requestPasswordReset(email);
      setStatus("Password reset email sent. Check your inbox.");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not send password reset email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 420,
          display: "grid",
          gap: 16,
          padding: 24,
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          background: "#FFFFFF",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>
            Reset password
          </h1>
          <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8 }}
          />
        </label>
        {status ? <p style={{ margin: 0, color: "#065F46" }}>{status}</p> : null}
        {error ? <p style={{ margin: 0, color: "#B91C1C" }}>{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px 16px",
            border: 0,
            borderRadius: 8,
            background: "#2563EB",
            color: "#FFFFFF",
            fontWeight: 700,
          }}
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
        <Link to="/login" style={{ color: "#2563EB", textDecoration: "none" }}>
          Back to login
        </Link>
      </form>
    </main>
  );
}
