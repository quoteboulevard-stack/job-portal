"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = exports.ERROR_MESSAGES = exports.VALIDATION = exports.CREDIT_AMOUNTS = exports.MESSAGE_STATUS = exports.COLLECTIONS = void 0;
exports.COLLECTIONS = {
    USERS: "users",
    MESSAGES: "messages",
    CONVERSATIONS: "conversations",
    JOBS: "jobs",
    APPLICATIONS: "applications",
    RESUMES: "resumes",
    CREDITS: "credits",
    NOTIFICATIONS: "notifications",
    SESSIONS: "sessions",
    AUDIT_LOGS: "auditLogs",
};
// Canonical message lifecycle statuses — keep in sync with types/index.ts MessageStatus
exports.MESSAGE_STATUS = {
    WAITING: "waiting",
    SENT: "sent",
    SEEN: "seen",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    EXPIRED: "expired",
    INVALID: "invalid",
};
exports.CREDIT_AMOUNTS = {
    SIGNUP_BONUS: 100,
    REFERRAL_REWARD: 50,
    REFERRAL_BONUS: 25,
    DAILY_LOGIN: 5,
    MESSAGE_COST: 1,
    MIN_PURCHASE: 100,
    MAX_PURCHASE: 10000,
};
exports.VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 32,
    MESSAGE_MAX_LENGTH: 2000,
    BIO_MAX_LENGTH: 500,
    PHONE_MIN_LENGTH: 7,
    PHONE_MAX_LENGTH: 15,
    MAX_FILE_SIZE_MB: 10,
    ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
};
exports.ERROR_MESSAGES = {
    INVALID_EMAIL: "Please enter a valid email address.",
    INVALID_PASSWORD: "Password must be 8–128 characters with uppercase, number, and special character.",
    INVALID_PHONE: "Please enter a valid phone number.",
    INVALID_URL: "Please enter a valid URL.",
    USER_NOT_FOUND: "User not found.",
    UNAUTHORIZED: "You must be signed in to perform this action.",
    FORBIDDEN: "You do not have permission to perform this action.",
    INSUFFICIENT_CREDITS: "Insufficient credits to complete this action.",
    MESSAGE_TOO_LONG: `Message cannot exceed ${2000} characters.`,
    FILE_TOO_LARGE: `File size cannot exceed ${10} MB.`,
    INVALID_FILE_TYPE: "File type not supported.",
    INTERNAL_ERROR: "Something went wrong. Please try again.",
    NETWORK_ERROR: "Network error. Please check your connection.",
};
exports.API = {
    BASE_URL: (_a = process.env["NEXT_PUBLIC_API_URL"]) !== null && _a !== void 0 ? _a : "/api",
    VERSION: "v1",
    TIMEOUT_MS: 10000,
    ENDPOINTS: {
        AUTH: {
            LOGIN: "/auth/login",
            LOGOUT: "/auth/logout",
            REGISTER: "/auth/register",
            REFRESH: "/auth/refresh",
            ME: "/auth/me",
        },
        USERS: {
            LIST: "/users",
            DETAIL: (id) => `/users/${id}`,
            UPDATE: (id) => `/users/${id}`,
        },
        MESSAGES: {
            LIST: "/messages",
            SEND: "/messages",
            DETAIL: (id) => `/messages/${id}`,
        },
        CREDITS: {
            BALANCE: "/credits/balance",
            PURCHASE: "/credits/purchase",
            HISTORY: "/credits/history",
        },
    },
};
//# sourceMappingURL=index.js.map