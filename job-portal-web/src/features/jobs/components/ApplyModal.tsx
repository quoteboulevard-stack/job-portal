import { useState } from "react";
import Button from "../../../shared/components/Button";

type Props = { open: boolean; jobTitle: string; resumes: string[]; onClose: () => void; onSubmit?: (payload: { resume: string; coverLetter: string }) => void };

export default function ApplyModal({ open, jobTitle, resumes, onClose, onSubmit }: Props) {
  const [resume, setResume] = useState(resumes[0] || ""), [coverLetter, setCoverLetter] = useState(""), [done, setDone] = useState(false);
  if (!open) return null;
  const submit = () => {
    onSubmit?.({ resume, coverLetter });
    setDone(true);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(17,24,39,0.3)", display: "grid", placeItems: "center", padding: 16, zIndex: 100 }}>
      <div role="dialog" aria-modal="true" aria-label={`Apply for ${jobTitle}`} style={{ width: "100%", maxWidth: 480, background: "#FFF", borderRadius: 8, boxShadow: "0 12px 32px rgba(17,24,39,0.16)", padding: 24, display: "grid", gap: 16 }}>
        <h2 style={{ margin: 0, fontSize: 24, color: "#111827" }}>Apply for {jobTitle}</h2>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>Resume</span>
          <select aria-label="Resume selector" value={resume} onChange={(e) => setResume(e.target.value)} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8 }}>
            {resumes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#6B7280" }}>Cover letter</span>
          <textarea aria-label="Cover letter" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} rows={4} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, resize: "vertical" }} />
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="success" fullWidth onClick={submit} ariaLabel="Apply Now">Apply Now</Button>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "10px 16px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#F3F4F6", color: "#6B7280" }}>Cancel</button>
        </div>
        {done && <div role="status" style={{ padding: "10px 12px", borderRadius: 8, background: "#ECFDF5", color: "#059669" }}>Application submitted successfully.</div>}
      </div>
    </div>
  );
}
