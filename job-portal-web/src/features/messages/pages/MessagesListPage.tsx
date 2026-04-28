import { Link } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import MessageCard from "../components/MessageCard";
import { useMessages } from "../hooks/useMessages";

export default function MessagesListPage() {
  const { user } = useAuth();
  const { requests, conversations, loading, error } = useMessages(
    user?.uid,
    user?.role
  );

  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <section
        style={{
          background: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Messages</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          Review message requests and continue active conversations.
        </p>
      </section>

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          Loading messages...
        </div>
      ) : null}
      {error && !loading ? (
        <div style={{ padding: 16, borderRadius: 12, background: "#FEF2F2", color: "#B91C1C" }}>
          {error}
        </div>
      ) : null}

      {!loading ? (
        <>
          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, color: "#111827" }}>Requests</h2>
            {requests.length === 0 ? (
              <div style={{ padding: 16, border: "1px dashed #D1D5DB", borderRadius: 12 }}>
                No message requests yet.
              </div>
            ) : (
              requests.map((request) => (
                <MessageCard
                  key={request.id}
                  name={
                    user?.uid === request.fromUserId ? request.toName : request.fromName
                  }
                  subject={request.subject}
                  status={request.status}
                  date={request.date}
                  creditCost={request.creditCost}
                />
              ))
            )}
          </section>

          <section style={{ display: "grid", gap: 12 }}>
            <h2 style={{ margin: 0, color: "#111827" }}>Conversations</h2>
            {conversations.length === 0 ? (
              <div style={{ padding: 16, border: "1px dashed #D1D5DB", borderRadius: 12 }}>
                No active conversations yet.
              </div>
            ) : (
              conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/messages/${conversation.id}`}
                  style={{
                    display: "grid",
                    gap: 6,
                    padding: 16,
                    border: "1px solid #E5E7EB",
                    borderRadius: 12,
                    background: "#FFFFFF",
                    color: "inherit",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <strong style={{ color: "#111827" }}>
                      {conversation.counterpartName}
                    </strong>
                    <span style={{ color: "#6B7280", fontSize: 14 }}>
                      {conversation.lastUpdated}
                    </span>
                  </div>
                  <span style={{ color: "#3B82F6", fontSize: 14 }}>
                    {conversation.title}
                  </span>
                  <p style={{ margin: 0, color: "#6B7280" }}>{conversation.lastMessage}</p>
                </Link>
              ))
            )}
          </section>
        </>
      ) : null}
    </section>
  );
}
