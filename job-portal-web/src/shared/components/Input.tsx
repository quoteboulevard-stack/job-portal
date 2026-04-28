import { ChangeEventHandler, CSSProperties, useId, useState } from "react";

type Props = { value: string; onChange: ChangeEventHandler<HTMLInputElement>; placeholder?: string; type?: string; error?: string; label: string };

export default function Input({ value, onChange, placeholder, type = "text", error, label }: Props) {
  const id = useId();
  const [focus, setFocus] = useState(false);
  const inputStyle: CSSProperties = {
    width: "100%", padding: "10px 12px", border: `1px solid ${error ? "#EF4444" : focus ? "#3B82F6" : "#E5E7EB"}`, borderRadius: 8,
    outline: "none", boxShadow: "none", color: "#111827", background: "#FFFFFF",
  };
  return (
    <label htmlFor={id} style={{ display: "grid", gap: 6 }}>
      <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>{label}</span>
      <input
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={inputStyle}
      />
      {error && <span id={`${id}-error`} style={{ color: "#EF4444", fontSize: 14 }}>{error}</span>}
    </label>
  );
}
