import { useEffect, useState } from "react";
import {
  listConversationsForUser,
  listMessageRequestsForUser,
} from "../services/messageService";
import type { ConversationRecord, MessageRequestRecord } from "../types";

export function useMessages(
  userId: string | undefined,
  role: "job_seeker" | "employer" | "admin" | undefined
) {
  const [requests, setRequests] = useState<MessageRequestRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !role) {
      setLoading(false);
      setRequests([]);
      setConversations([]);
      setError("Sign in to view messages.");
      return;
    }

    let mounted = true;
    setLoading(true);

    Promise.all([
      listMessageRequestsForUser(userId),
      listConversationsForUser(userId, role),
    ])
      .then(([requestData, conversationData]) => {
        if (!mounted) return;
        setRequests(requestData);
        setConversations(conversationData);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load messages.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [role, userId]);

  return { requests, conversations, loading, error };
}
