import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import MessageCard from "../../messages/components/MessageCard";
import {
  acceptMessageRequest,
  listPendingEmployerMessages,
  rejectMessageRequest,
} from "../../messages/services/messageService";
import type { MessageRequestRecord } from "../../messages/types";

export default function EmployerMessageRequestsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!user) return Promise.resolve();
    setLoading(true);
    return listPendingEmployerMessages(user.uid)
      .then((data) => {
        setMessages(data);
        setError(null);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load message requests."
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    void load();
  }, [user?.uid]);

  const accept = async (message: MessageRequestRecord) => {
    if (!user) return;
    try {
      const conversationId = await acceptMessageRequest(message, user.uid);
      await load();
      navigate(`/messages/${conversationId}`);
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Failed to accept message request."
      );
    }
  };

  const reject = async (messageId: string) => {
    try {
      await rejectMessageRequest(messageId);
      await load();
    } catch (rejectError) {
      setError(
        rejectError instanceof Error
          ? rejectError.message
          : "Failed to reject message request."
      );
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
        <h1 style={{ margin: 0, fontSize: 28, color: "#111827" }}>
          Message requests
        </h1>
        <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
          Approve or reject incoming recruiter conversations before they become chats.
        </p>
      </div>

      {error ? (
        <div style={{ padding: 16, color: "#B91C1C", background: "#FEF2F2", borderRadius: 12 }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          Loading message requests...
        </div>
      ) : messages.length === 0 ? (
        <div style={{ padding: 24, border: "1px solid #E5E7EB", borderRadius: 12 }}>
          No pending message requests.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "grid",
                gap: 12,
                padding: 4,
                borderRadius: 12,
                background: "#F9FAFB",
              }}
            >
              <MessageCard
                name={message.fromName}
                subject={message.subject}
                status={message.status}
                date={message.date}
                creditCost={message.creditCost}
                onView={() => void accept(message)}
                onDelete={() => void reject(message.id)}
                onRetry={() => void accept(message)}
              />
              <p style={{ margin: 0, padding: "0 12px 12px", color: "#6B7280" }}>
                {message.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
