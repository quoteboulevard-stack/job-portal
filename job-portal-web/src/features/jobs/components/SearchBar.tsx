import { FormEvent, useEffect, useState } from "react";

type Props = { value?: string; onChange?: (value: string) => void; onSubmit?: (value: string) => void; suggestions?: string[] };
const icon = { fontFamily: '"Material Symbols Outlined","Material Icons",sans-serif', fontSize: 18, lineHeight: 1 };

export default function SearchBar({ value = "", onChange, onSubmit, suggestions = [] }: Props) {
  const [query, setQuery] = useState(value);
  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    const id = window.setTimeout(() => onChange?.(query), 300);
    return () => window.clearTimeout(id);
  }, [query, onChange]);
  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit?.(query); };
  return (
    <form onSubmit={submit} style={{ position: "sticky", top: 0, zIndex: 10, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: 16, border: "2px solid #3B82F6", borderRadius: 8, background: "#FFF" }}>
        <span aria-hidden="true" style={icon}>search</span>
        <input
          aria-label="Search jobs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs by title, company, skills..."
          style={{ flex: 1, border: 0, outline: "none", fontSize: 16 }}
        />
        {query && <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); onSubmit?.(""); }} style={{ border: 0, background: "transparent", cursor: "pointer" }}><span aria-hidden="true" style={icon}>close</span></button>}
      </div>
      {!!suggestions.length && (
        <div role="listbox" style={{ marginTop: 4, border: "1px solid #E5E7EB", borderRadius: 8, background: "#FFF" }}>
          {suggestions.map((item) => <button key={item} type="button" onClick={() => { setQuery(item); onSubmit?.(item); }} style={{ display: "block", width: "100%", padding: "10px 16px", border: 0, background: "#FFF", textAlign: "left" }}>{item}</button>)}
        </div>
      )}
    </form>
  );
}
