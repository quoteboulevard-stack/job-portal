import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import ChatBox from "../components/ChatBox";

export default function ChatPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();

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
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>Chat</h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          Continue the live conversation.
        </p>
      </div>
      <ChatBox conversationId={conversationId} currentUserId={user?.uid} />
    </section>
  );
}
