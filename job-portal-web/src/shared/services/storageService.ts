import { doc, onSnapshot } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebaseService";

export type ParsedResumeSnapshot = {
  status: "idle" | "processing" | "success" | "error";
  error?: string;
  parsed?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    skills?: string[];
    experience?: Array<{
      title: string;
      company: string;
      duration: string;
      description: string;
    }>;
    education?: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
  };
  fileName?: string;
};

export async function uploadResumeFile(
  userId: string,
  file: File
): Promise<{ path: string; downloadUrl: string }> {
  const path = `resumes/${userId}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const downloadUrl = await getDownloadURL(storageRef);
  return { path, downloadUrl };
}

export function subscribeToParsedResume(
  userId: string,
  callback: (snapshot: ParsedResumeSnapshot) => void
): () => void {
  return onSnapshot(doc(db, "resumes", userId), (snap) => {
    if (!snap.exists()) {
      callback({ status: "idle" });
      return;
    }

    const data = snap.data() as Record<string, unknown>;
    callback({
      status:
        data["status"] === "success"
          ? "success"
          : data["status"] === "error"
            ? "error"
            : "processing",
      error: typeof data["error"] === "string" ? data["error"] : undefined,
      parsed:
        typeof data["parsed"] === "object" && data["parsed"]
          ? (data["parsed"] as ParsedResumeSnapshot["parsed"])
          : undefined,
      fileName:
        typeof data["meta"] === "object" &&
        data["meta"] &&
        typeof (data["meta"] as Record<string, unknown>)["fileName"] === "string"
          ? String((data["meta"] as Record<string, unknown>)["fileName"])
          : undefined,
    });
  });
}
