// ─── Firestore Collections ────────────────────────────────────────────────────

export { COLLECTIONS } from '@job-portal/shared';

export const DOCUMENTS = {
  APP_CONFIG: 'config/appConfig',
  FEATURE_FLAGS: 'config/featureFlags',
} as const;

// ─── Timeouts (ms) ───────────────────────────────────────────────────────────

export const TIMEOUTS = {
  DEFAULT_REQUEST: 30_000,
  LONG_RUNNING: 540_000,   // Cloud Functions max (9 min)
  DB_QUERY: 10_000,
  STORAGE_UPLOAD: 120_000,
  AUTH_TOKEN: 3_600_000,   // 1 hour
} as const;

// ─── Error Codes ─────────────────────────────────────────────────────────────

export const ERROR_CODES = {
  // Auth
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_UNAUTHORIZED: 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',
  // Data
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  PRECONDITION_FAILED: 'PRECONDITION_FAILED',
  // System
  INTERNAL: 'INTERNAL',
  UNAVAILABLE: 'UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// ─── Error Messages ───────────────────────────────────────────────────────────

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired.',
  [ERROR_CODES.AUTH_TOKEN_INVALID]: 'Authentication token is invalid.',
  [ERROR_CODES.AUTH_UNAUTHORIZED]: 'Authentication required.',
  [ERROR_CODES.AUTH_FORBIDDEN]: 'You do not have permission to perform this action.',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.ALREADY_EXISTS]: 'A resource with this identifier already exists.',
  [ERROR_CODES.INVALID_ARGUMENT]: 'One or more request arguments are invalid.',
  [ERROR_CODES.PRECONDITION_FAILED]: 'Operation precondition was not met.',
  [ERROR_CODES.INTERNAL]: 'An internal server error occurred.',
  [ERROR_CODES.UNAVAILABLE]: 'The service is temporarily unavailable.',
  [ERROR_CODES.TIMEOUT]: 'The operation timed out.',
  [ERROR_CODES.RESOURCE_EXHAUSTED]: 'Resource quota has been exhausted.',
};

// ─── Pagination ───────────────────────────────────────────────────────────────

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ─── Storage Paths ────────────────────────────────────────────────────────────

export const STORAGE_PATHS = {
  USER_AVATARS:    (uid: string) => `users/${uid}/avatar`,
  RESUME_UPLOADS:  (uid: string) => `users/${uid}/resumes`,
} as const;
