import { FormEvent, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import ProfileCard from "../components/ProfileCard";
import ResumeEditor from "../components/ResumeEditor";
import { useAuth } from "../hooks/useAuth";
import { updateUserProfile } from "../services/authService";
import { setUser } from "../store/authSlice";
import { db } from "../../../shared/services/firebaseService";
import {
  subscribeToParsedResume,
  uploadResumeFile,
  type ParsedResumeSnapshot,
} from "../../../shared/services/storageService";

export default function ProfilePage() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState(user?.location ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resume, setResume] = useState<ParsedResumeSnapshot>({ status: "idle" });

  useEffect(() => {
    if (!user) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      const data = snap.exists() ? (snap.data() as Record<string, unknown>) : {};
      setTitle(typeof data["title"] === "string" ? data["title"] : "");
      setLocation(typeof data["location"] === "string" ? data["location"] : user.location);
      setName(typeof data["displayName"] === "string" ? data["displayName"] : user.name);
    });

    return subscribeToParsedResume(user.uid, setResume);
  }, [user]);

  if (!user) return null;

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setError(null);
      setStatus(null);
      await updateUserProfile({ uid: user.uid, name, location, title });
      dispatch(
        setUser({
          ...user,
          name,
          location,
        })
      );
      setStatus("Profile updated.");
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update profile."
      );
    }
  };

  const uploadResume = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      setStatus("Resume uploaded. Parsing started.");
      await uploadResumeFile(user.uid, file);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "Resume upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16, padding: 16 }}>
      <ProfileCard name={name || user.name} title={title || user.role} location={location || user.location} />
      <form
        onSubmit={saveProfile}
        style={{
          display: "grid",
          gap: 16,
          padding: 24,
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          background: "#FFFFFF",
        }}
      >
        <h2 style={{ margin: 0, color: "#111827" }}>Profile details</h2>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>Name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8 }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>Location</span>
          <input value={location} onChange={(event) => setLocation(event.target.value)} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8 }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>Professional title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8 }} />
        </label>
        <button type="submit" style={{ padding: "12px 16px", border: 0, borderRadius: 8, background: "#2563EB", color: "#FFFFFF", fontWeight: 700 }}>
          Save profile
        </button>
      </form>

      <section
        style={{
          display: "grid",
          gap: 12,
          padding: 24,
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          background: "#FFFFFF",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#111827" }}>Resume upload</h2>
          <p style={{ margin: "8px 0 0", color: "#6B7280" }}>
            Upload a PDF or DOCX to trigger backend parsing.
          </p>
        </div>
        <input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(event) => void uploadResume(event.target.files?.[0] ?? null)}
          disabled={uploading}
        />
        {resume.fileName ? <p style={{ margin: 0, color: "#374151" }}>Latest file: {resume.fileName}</p> : null}
        <p style={{ margin: 0, color: resume.status === "error" ? "#B91C1C" : "#6B7280" }}>
          {resume.status === "processing"
            ? "Resume is being parsed."
            : resume.status === "success"
              ? "Resume parsed successfully."
              : resume.status === "error"
                ? resume.error || "Resume parsing failed."
                : "No resume uploaded yet."}
        </p>
        {resume.parsed ? (
          <div style={{ display: "grid", gap: 8, padding: 16, background: "#F9FAFB", borderRadius: 8 }}>
            <strong>Parsed resume data</strong>
            <span>Name: {resume.parsed.name || "N/A"}</span>
            <span>Email: {resume.parsed.email || "N/A"}</span>
            <span>Phone: {resume.parsed.phone || "N/A"}</span>
            <span>Skills: {resume.parsed.skills?.join(", ") || "N/A"}</span>
          </div>
        ) : null}
      </section>

      <ResumeEditor />
      {status ? <p style={{ margin: 0, color: "#065F46" }}>{status}</p> : null}
      {error ? <p style={{ margin: 0, color: "#B91C1C" }}>{error}</p> : null}
    </section>
  );
}
