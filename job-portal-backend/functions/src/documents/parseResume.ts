import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';
import { getFirestore, getStorage } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import type { FileMeta, ParsedResume, ResumeDocument, SupportedMimeType } from './types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_TYPES = new Set<string>([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const RESUME_PATH_RE = /^resumes\/(?<userId>[^/]+)\/.+\.(pdf|docx)$/;

const claude = new Anthropic({ apiKey: config.CLAUDE_API_KEY });

// ─── Text extraction ──────────────────────────────────────────────────────────

async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const result = await pdfParse(buffer);
    return result.text;
  }
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// ─── Claude parsing ───────────────────────────────────────────────────────────

async function parseWithClaude(text: string): Promise<ParsedResume> {
  const message = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content:
          'Extract the following fields from this resume and return ONLY valid JSON, no markdown:\n' +
          '{ "name": string|null, "email": string|null, "phone": string|null,' +
          '  "skills": string[], "experience": [{"title":string,"company":string,"duration":string,"description":string}],' +
          '  "education": [{"degree":string,"institution":string,"year":string}] }' +
          `\n\nResume:\n${text}`,
      },
    ],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  return JSON.parse(raw) as ParsedResume;
}

// ─── Cloud Function ───────────────────────────────────────────────────────────

export const parseResume = functions
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .storage.object()
  .onFinalize(async (object): Promise<void> => {
    const { name: filePath, size, contentType, timeCreated, bucket } = object;

    const match = filePath?.match(RESUME_PATH_RE);
    if (!match?.groups?.userId) return;

    const { userId } = match.groups;
    const db = getFirestore();
    const docRef = db.collection('resumes').doc(userId);

    const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

    const saveError = (msg: string) =>
      docRef.set({ userId, status: 'error', error: msg, parsed: undefined, meta: undefined, updatedAt: serverTs } satisfies Partial<ResumeDocument>, { merge: true });

    if (!contentType || !SUPPORTED_TYPES.has(contentType)) {
      await saveError(`Unsupported file type: ${contentType ?? 'unknown'}. Only PDF and DOCX are accepted.`);
    }

    const fileSize = Number(size);
    if (fileSize > MAX_FILE_SIZE) {
      await saveError(`File exceeds 5 MB limit (${(fileSize / 1024 / 1024).toFixed(1)} MB).`);
    }

    const meta: FileMeta = {
      fileName: filePath!.split('/').pop()!,
      fileSize,
      mimeType: contentType as SupportedMimeType,
      uploadedAt: admin.firestore.Timestamp.fromDate(new Date(timeCreated!)),
    };

    let buffer!: Buffer;
    try {
      const [contents] = await getStorage().bucket(bucket).file(filePath!).download();
      buffer = contents as Buffer;
    } catch {
      await saveError('Failed to download file from Storage.');
    }

    let rawText!: string;
    try {
      rawText = await extractText(buffer, contentType!);
      if (!rawText.trim()) throw new Error('Empty document');
    } catch (err: unknown) {
      await saveError(`Text extraction failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }

    let parsed!: ParsedResume;
    try {
      parsed = await parseWithClaude(rawText);
    } catch (err: unknown) {
      await saveError(`Claude parsing failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }

    const doc: ResumeDocument = { userId, parsed, meta, status: 'success', updatedAt: serverTs };
    await docRef.set(doc);
  });
