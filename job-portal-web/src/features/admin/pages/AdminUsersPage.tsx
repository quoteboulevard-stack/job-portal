import { useEffect, useState } from "react";
import {
  listAllUsers,
  updateUserRole,
  type AdminUserRecord,
} from "../services/adminService";
import type { UserRole } from "../../auth/types";
import "./AdminPages.css";

const roles: UserRole[] = ["job_seeker", "employer", "admin"];
const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  admin: "admin-badge--admin",
  employer: "admin-badge--employer",
  job_seeker: "admin-badge--job-seeker",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadPage = (startAfter?: string) => {
    if (startAfter) setLoadingMore(true);
    else setLoading(true);
    return listAllUsers({ startAfter })
      .then((result) => {
        setUsers((prev) => startAfter ? [...prev, ...result.items] : result.items);
        setNextPageToken(result.nextPageToken);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load users."))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  };

  useEffect(() => { void loadPage(); }, []);

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
    <section className="admin-page">
      <div className="admin-page__hero">
        <h1 className="admin-page__title">Users</h1>
        <p className="admin-page__subtitle">
          All registered users. Change role using the dropdown.
        </p>
      </div>

      {error ? (
        <div className="admin-page__error">{error}</div>
      ) : null}

      {loading ? (
        <div className="admin-page__placeholder">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="admin-page__placeholder">No users found.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr className="admin-table__head-row">
                {["Name", "Email", "Role", "Location", "Credits", "Joined", "Change role"].map((h) => (
                  <th key={h} className="admin-table__head-cell">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className="admin-table__row">
                  <td className="admin-table__cell admin-table__cell--primary">{u.name || "—"}</td>
                  <td className="admin-table__cell admin-table__cell--reason">{u.email}</td>
                  <td className="admin-table__cell">
                    <span className={`admin-badge ${ROLE_BADGE_CLASS[u.role]}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="admin-table__cell admin-table__cell--reason">{u.location || "—"}</td>
                  <td className="admin-table__cell admin-table__cell--balance">{u.balance}</td>
                  <td className="admin-table__cell admin-table__cell--date">{u.createdAt}</td>
                  <td className="admin-table__cell">
                    <select
                      value={u.role}
                      disabled={savingId === u.uid}
                      onChange={(e) => void changeRole(u.uid, e.target.value as UserRole)}
                      className="admin-select admin-select--compact"
                      aria-label={`Change role for ${u.name || u.email}`}
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
