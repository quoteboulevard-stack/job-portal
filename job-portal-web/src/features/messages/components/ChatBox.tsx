import { FormEvent, useEffect, useRef, useState } from "react";
import useChat from "../hooks/useChat";

type Props = { conversationId: string | undefined; currentUserId: string | undefined };

export default function ChatBox({ conversationId, currentUserId }: Props) {
  const { messages, loading, sendMessage } = useChat(conversationId, currentUserId);
  const [value, setValue] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages, loading]);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(value);
    setValue("");
  };
  return (
    <section style={{ display: "grid", gridTemplateRows: "1fr auto", height: "100%", minHeight: 420, border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFF" }}>
      <div style={{ overflowY: "auto", padding: 16, display: "grid", gap: 12 }}>
        {messages.map((message) => (
          <div key={message.id} style={{ display: "grid", justifyItems: message.sender === "me" ? "end" : "start" }}>
            <div style={{ maxWidth: "75%", padding: "10px 12px", borderRadius: 8, background: message.sender === "me" ? "#3B82F6" : "#E5E7EB", color: message.sender === "me" ? "#FFF" : "#111827" }}>{message.text}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>{message.time}{message.sender === "me" ? ` ${message.receipt === "read" ? "\u2713\u2713" : "\u2713"}` : ""}</div>
          </div>
        ))}
        {loading && <div style={{ width: "60%", height: 44, borderRadius: 8, background: "linear-gradient(90deg,#E5E7EB 0%,#F3F4F6 50%,#E5E7EB 100%)" }} />}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, padding: 16, borderTop: "1px solid #E5E7EB" }}>
        <input aria-label="Message input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Write a message" style={{ flex: 1, padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, outline: "none" }} />
        <button type="submit" style={{ padding: "10px 16px", border: 0, borderRadius: 8, background: "#3B82F6", color: "#FFF", fontWeight: 600 }}>Send</button>
      </form>
    </section>
  );
}
