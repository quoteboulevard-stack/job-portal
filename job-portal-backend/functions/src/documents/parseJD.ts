import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import Anthropic from '@anthropic-ai/sdk';
import pdfParse = require('pdf-parse');
import * as mammoth from 'mammoth';
import { getFirestore, getStorage } from '../shared/firebaseAdmin';
import { config } from '../shared/validateEnv';
import type { FileMeta, JDDocument, ParsedJD, SupportedMimeType } from './types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_TYPES = new Set<string>([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const JD_PATH_RE = /^jobs\/(?<jobId>[^/]+)\/.+\.(pdf|docx)$/;

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

async function parseWithClaude(text: string): Promise<ParsedJD> {
  const message = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content:
          'Extract the following fields from this job description and return ONLY valid JSON, no markdown:\n' +
          '{ "title": string|null, "requirements": string[], "skills": string[],' +
          '  "experience_years": number|null,' +
          '  "salary_range": { "min": number|null, "max": number|null, "currency": string } | null }' +
          `\n\nJob Description:\n${text}`,
      },
    ],
  });

  const raw = (message.content[0] as { type: string; text: string }).text.trim();
  return JSON.parse(raw) as ParsedJD;
}

// ─── Cloud Function ───────────────────────────────────────────────────────────

export const parseJD = functions
  .runWith({ timeoutSeconds: 60, memory: '512MB' })
  .storage.object()
  .onFinalize(async (object): Promise<void> => {
    const { name: filePath, size, contentType, timeCreated, bucket } = object;

    const match = filePath?.match(JD_PATH_RE);
    if (!match?.groups?.jobId) return;

    const { jobId } = match.groups;
    const db = getFirestore();
    const docRef = db.collection('jobs').doc(jobId);
    const serverTs = admin.firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp;

    const saveError = (msg: string) =>
      docRef.set(
        { jobId, status: 'error', error: msg, parsed: undefined, meta: undefined, updatedAt: serverTs } satisfies Partial<JDDocument>,
        { merge: true }
      );

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

    let parsed!: ParsedJD;
    try {
      parsed = await parseWithClaude(rawText);
    } catch (err: unknown) {
      await saveError(`Claude parsing failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }

    const doc: JDDocument = { jobId, parsed, meta, status: 'success', updatedAt: serverTs };
    await docRef.set(doc);
  });
