import { useEffect, useMemo, useState } from "react";
import { sendChatMessage, subscribeToChat } from "../services/messageService";
import type { ChatMessageRecord } from "../types";

export type ChatMessage = {
  id: string;
  text: string;
  sender: "me" | "them";
  time: string;
  receipt?: "seen" | "read";
};

export default function useChat(
  conversationId: string | undefined,
  currentUserId: string | undefined
) {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToChat(conversationId, currentUserId, (next) => {
      setMessages(next);
      setLoading(false);
    });

    return unsubscribe;
  }, [conversationId, currentUserId]);

  const sendMessage = async (text: string) => {
    if (!conversationId || !text.trim()) return;
    await sendChatMessage(conversationId, text);
  };

  return {
    messages: useMemo<ChatMessage[]>(
      () =>
        messages.map((message) => ({
          id: message.id,
          text: message.text,
          sender: message.senderId === currentUserId ? "me" : "them",
          time: message.time,
          receipt: message.receipt,
        })),
      [currentUserId, messages]
    ),
    loading,
    sendMessage,
  };
}
