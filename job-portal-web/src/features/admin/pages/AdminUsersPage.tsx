import { useEffect, useState } from "react";
import {
  listAllUsers,
  updateUserRole,
  type AdminUserRecord,
} from "../services/adminService";
import type { UserRole } from "../../auth/types";

const roles: UserRole[] = ["job_seeker", "employer", "admin"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    return listAllUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { void load(); }, []);

  const changeRole = async (uid: string, role: UserRole) => {
    try {
      setSavingId(uid);
      await updateUserRole(uid, role);
      setUsers((prev) =>
        prev.map((u) => (u.uid === uid ? { ...u, role } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Users</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          All registered users. Change role using the dropdown.
        </p>
      </div>

      {error ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          Loading users...
        </div>
      ) : users.length === 0 ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          No users found.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFFFF", borderRadius: 12, overflow: "hidden", border: "1px solid #E5E7EB" }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Name", "Email", "Role", "Location", "Credits", "Joined", "Change role"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#6B7280", fontWeight: 700, borderBottom: "1px solid #E5E7EB" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <td style={{ padding: "12px 16px", color: "#111827", fontWeight: 600 }}>{u.name || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 14 }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "2px 10px",
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 700,
                      background: u.role === "admin" ? "#FEF3C7" : u.role === "employer" ? "#EFF6FF" : "#F0FDF4",
                      color: u.role === "admin" ? "#92400E" : u.role === "employer" ? "#1D4ED8" : "#166534",
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 14 }}>{u.location || "—"}</td>
                  <td style={{ padding: "12px 16px", color: "#111827" }}>{u.balance}</td>
                  <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 14 }}>{u.createdAt}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <select
                      value={u.role}
                      disabled={savingId === u.uid}
                      onChange={(e) => void changeRole(u.uid, e.target.value as UserRole)}
                      style={{ padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 6, fontSize: 14 }}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
