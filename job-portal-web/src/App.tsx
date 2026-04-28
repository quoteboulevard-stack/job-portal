import { ReactNode } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import LoginPage from "./features/auth/pages/LoginPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ProfilePage from "./features/auth/pages/ProfilePage";
import SignupPage from "./features/auth/pages/SignupPage";
import ApplicationTrackerPage from "./features/applications/pages/ApplicationTrackerPage";
import CreditShopPage from "./features/credits/pages/CreditShopPage";
import DashboardPage from "./features/dashboard/pages/DashboardPage";
import EmployerDashboard from "./features/dashboard/pages/EmployerDashboard";
import EmployerApplicantsPage from "./features/employer/pages/EmployerApplicantsPage";
import EmployerMessageRequestsPage from "./features/employer/pages/EmployerMessageRequestsPage";
import EmployerPostJobPage from "./features/employer/pages/EmployerPostJobPage";
import JobDetailPage from "./features/jobs/pages/JobDetailPage";
import JobListPage from "./features/jobs/pages/JobListPage";
import ChatPage from "./features/messages/pages/ChatPage";
import MessagesListPage from "./features/messages/pages/MessagesListPage";
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import AdminUsersPage from "./features/admin/pages/AdminUsersPage";
import AdminJobsPage from "./features/admin/pages/AdminJobsPage";
import AdminApplicationsPage from "./features/admin/pages/AdminApplicationsPage";
import AdminMessagesPage from "./features/admin/pages/AdminMessagesPage";
import AdminCreditLogPage from "./features/admin/pages/AdminCreditLogPage";
import Button from "./shared/components/Button";
import Footer from "./shared/components/Footer";
import { useAuth } from "./features/auth/hooks/useAuth";

function AppLayout() {
  const { user, logout } = useAuth();

  const links =
    user?.role === "admin"
      ? [
          { to: "/admin", label: "Overview" },
          { to: "/admin/users", label: "Users" },
          { to: "/admin/jobs", label: "Jobs" },
          { to: "/admin/applications", label: "Applications" },
          { to: "/admin/messages", label: "Messages" },
          { to: "/admin/credits", label: "Credits" },
        ]
      : user?.role === "employer"
      ? [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/jobs", label: "Jobs" },
          { to: "/employer/jobs/new", label: "Post Job" },
          { to: "/employer/applicants", label: "Applicants" },
          { to: "/employer/messages", label: "Messages" },
        ]
      : [
          { to: "/dashboard", label: "Dashboard" },
          { to: "/jobs", label: "Jobs" },
          { to: "/applications", label: "Applications" },
          { to: "/messages", label: "Messages" },
          { to: "/credits", label: "Credits" },
        ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <Link className="app-brand" to={user ? "/dashboard" : "/jobs"}>
            JobPortal
          </Link>
          <nav className="app-nav" aria-label="Primary">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="app-header__actions">
            {user ? (
              <>
                <span className="app-link-muted">
                  {user.name} · {user.role === "employer" ? "Employer" : "Job Seeker"}
                </span>
                <Button variant="secondary" size="sm" onClick={() => void logout()}>
                  Logout
                </Button>
                <Link className="app-link-muted" to="/profile">
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link className="app-link-muted" to="/login">
                  Sign in
                </Link>
                <Link to="/signup">
                  <Button size="sm">Create account</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageMessage title="Loading account" body="Checking your session." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RequireRole({
  role,
  children,
}: {
  role: "job_seeker" | "employer" | "admin";
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageMessage title="Loading account" body="Checking your session." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageMessage title="Loading workspace" body="Preparing your portal." />;
  }

  if (!user) return <Navigate to="/jobs" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return user.role === "employer" ? <EmployerDashboard /> : <DashboardPage />;
}

function PageMessage({ title, body }: { title: string; body: string }) {
  return (
    <section
      style={{
        minHeight: 320,
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          display: "grid",
          gap: 8,
          padding: 24,
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, color: "#111827" }}>{title}</h1>
        <p style={{ margin: 0, color: "#6B7280", lineHeight: 1.6 }}>{body}</p>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/jobs" element={<JobListPage />} />
          <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardRouter />
              </RequireAuth>
            }
          />
          <Route
            path="/applications"
            element={
              <RequireRole role="job_seeker">
                <ApplicationTrackerPage />
              </RequireRole>
            }
          />
          <Route
            path="/messages"
            element={
              <RequireAuth>
                <MessagesListPage />
              </RequireAuth>
            }
          />
          <Route
            path="/messages/:conversationId"
            element={
              <RequireAuth>
                <ChatPage />
              </RequireAuth>
            }
          />
          <Route
            path="/credits"
            element={
              <RequireRole role="job_seeker">
                <CreditShopPage />
              </RequireRole>
            }
          />
          <Route
            path="/employer/jobs/new"
            element={
              <RequireRole role="employer">
                <EmployerPostJobPage />
              </RequireRole>
            }
          />
          <Route
            path="/employer/applicants"
            element={
              <RequireRole role="employer">
                <EmployerApplicantsPage />
              </RequireRole>
            }
          />
          <Route
            path="/employer/messages"
            element={
              <RequireRole role="employer">
                <EmployerMessageRequestsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboardPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireRole role="admin">
                <AdminUsersPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/jobs"
            element={
              <RequireRole role="admin">
                <AdminJobsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/applications"
            element={
              <RequireRole role="admin">
                <AdminApplicationsPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/messages"
            element={
              <RequireRole role="admin">
                <AdminMessagesPage />
              </RequireRole>
            }
          />
          <Route
            path="/admin/credits"
            element={
              <RequireRole role="admin">
                <AdminCreditLogPage />
              </RequireRole>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
