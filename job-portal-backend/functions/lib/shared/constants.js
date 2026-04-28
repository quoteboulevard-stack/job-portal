"use strict";
// ─── Firestore Collections ────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_PATHS = exports.PAGINATION = exports.ERROR_MESSAGES = exports.ERROR_CODES = exports.TIMEOUTS = exports.DOCUMENTS = exports.COLLECTIONS = void 0;
var shared_1 = require("@job-portal/shared");
Object.defineProperty(exports, "COLLECTIONS", { enumerable: true, get: function () { return shared_1.COLLECTIONS; } });
exports.DOCUMENTS = {
    APP_CONFIG: 'config/appConfig',
    FEATURE_FLAGS: 'config/featureFlags',
};
// ─── Timeouts (ms) ───────────────────────────────────────────────────────────
exports.TIMEOUTS = {
    DEFAULT_REQUEST: 30000,
    LONG_RUNNING: 540000, // Cloud Functions max (9 min)
    DB_QUERY: 10000,
    STORAGE_UPLOAD: 120000,
    AUTH_TOKEN: 3600000, // 1 hour
};
// ─── Error Codes ─────────────────────────────────────────────────────────────
exports.ERROR_CODES = {
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
};
// ─── Error Messages ───────────────────────────────────────────────────────────
exports.ERROR_MESSAGES = {
    [exports.ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired.',
    [exports.ERROR_CODES.AUTH_TOKEN_INVALID]: 'Authentication token is invalid.',
    [exports.ERROR_CODES.AUTH_UNAUTHORIZED]: 'Authentication required.',
    [exports.ERROR_CODES.AUTH_FORBIDDEN]: 'You do not have permission to perform this action.',
    [exports.ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
    [exports.ERROR_CODES.ALREADY_EXISTS]: 'A resource with this identifier already exists.',
    [exports.ERROR_CODES.INVALID_ARGUMENT]: 'One or more request arguments are invalid.',
    [exports.ERROR_CODES.PRECONDITION_FAILED]: 'Operation precondition was not met.',
    [exports.ERROR_CODES.INTERNAL]: 'An internal server error occurred.',
    [exports.ERROR_CODES.UNAVAILABLE]: 'The service is temporarily unavailable.',
    [exports.ERROR_CODES.TIMEOUT]: 'The operation timed out.',
    [exports.ERROR_CODES.RESOURCE_EXHAUSTED]: 'Resource quota has been exhausted.',
};
// ─── Pagination ───────────────────────────────────────────────────────────────
exports.PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
// ─── Storage Paths ────────────────────────────────────────────────────────────
exports.STORAGE_PATHS = {
    USER_AVATARS: (uid) => `users/${uid}/avatar`,
    RESUME_UPLOADS: (uid) => `users/${uid}/resumes`,
};
//# sourceMappingURL=constants.js.map