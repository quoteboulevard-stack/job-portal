"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseResume = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const pdfParse = require("pdf-parse");
const mammoth = __importStar(require("mammoth"));
const firebaseAdmin_1 = require("../shared/firebaseAdmin");
const validateEnv_1 = require("../shared/validateEnv");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const SUPPORTED_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const RESUME_PATH_RE = /^resumes\/(?<userId>[^/]+)\/.+\.(pdf|docx)$/;
const claude = new sdk_1.default({ apiKey: validateEnv_1.config.CLAUDE_API_KEY });
// ─── Text extraction ──────────────────────────────────────────────────────────
async function extractText(buffer, mimeType) {
    if (mimeType === 'application/pdf') {
        const result = await pdfParse(buffer);
        return result.text;
    }
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}
// ─── Claude parsing ───────────────────────────────────────────────────────────
async function parseWithClaude(text) {
    const message = await claude.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: 'Extract the following fields from this resume and return ONLY valid JSON, no markdown:\n' +
                    '{ "name": string|null, "email": string|null, "phone": string|null,' +
                    '  "skills": string[], "experience": [{"title":string,"company":string,"duration":string,"description":string}],' +
                    '  "education": [{"degree":string,"institution":string,"year":string}] }' +
                    `\n\nResume:\n${text}`,
            },
        ],
    });
    const raw = message.content[0].text.trim();
    return JSON.parse(raw);
}
// ─── Cloud Function ───────────────────────────────────────────────────────────
exports.parseResume = functions
    .runWith({ timeoutSeconds: 60, memory: '512MB' })
    .storage.object()
    .onFinalize(async (object) => {
    const { name: filePath, size, contentType, timeCreated, bucket } = object;
    const match = filePath?.match(RESUME_PATH_RE);
    if (!match?.groups?.userId)
        return;
    const { userId } = match.groups;
    const db = (0, firebaseAdmin_1.getFirestore)();
    const docRef = db.collection('resumes').doc(userId);
    const serverTs = admin.firestore.FieldValue.serverTimestamp();
    const saveError = (msg) => docRef.set({ userId, status: 'error', error: msg, parsed: undefined, meta: undefined, updatedAt: serverTs }, { merge: true });
    if (!contentType || !SUPPORTED_TYPES.has(contentType)) {
        await saveError(`Unsupported file type: ${contentType ?? 'unknown'}. Only PDF and DOCX are accepted.`);
    }
    const fileSize = Number(size);
    if (fileSize > MAX_FILE_SIZE) {
        await saveError(`File exceeds 5 MB limit (${(fileSize / 1024 / 1024).toFixed(1)} MB).`);
    }
    const meta = {
        fileName: filePath.split('/').pop(),
        fileSize,
        mimeType: contentType,
        uploadedAt: admin.firestore.Timestamp.fromDate(new Date(timeCreated)),
    };
    let buffer;
    try {
        const [contents] = await (0, firebaseAdmin_1.getStorage)().bucket(bucket).file(filePath).download();
        buffer = contents;
    }
    catch {
        await saveError('Failed to download file from Storage.');
    }
    let rawText;
    try {
        rawText = await extractText(buffer, contentType);
        if (!rawText.trim())
            throw new Error('Empty document');
    }
    catch (err) {
        await saveError(`Text extraction failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    let parsed;
    try {
        parsed = await parseWithClaude(rawText);
    }
    catch (err) {
        await saveError(`Claude parsing failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
    const doc = { userId, parsed, meta, status: 'success', updatedAt: serverTs };
    await docRef.set(doc);
});
//# sourceMappingURL=parseResume.js.map