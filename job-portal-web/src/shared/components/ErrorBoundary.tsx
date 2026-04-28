import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <section
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#F9FAFB",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: "100%",
              padding: 32,
              background: "#FFFFFF",
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              display: "grid",
              gap: 12,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 22, color: "#111827" }}>
              Something went wrong
            </h1>
            <p style={{ margin: 0, color: "#6B7280" }}>
              An unexpected error occurred. Please refresh the page.
            </p>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#9CA3AF",
                fontFamily: "monospace",
                wordBreak: "break-word",
              }}
            >
              {this.state.error.message}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 16px",
                border: 0,
                borderRadius: 8,
                background: "#2563EB",
                color: "#FFFFFF",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Refresh page
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
