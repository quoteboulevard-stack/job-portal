export const COLLECTIONS = {
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
} as const;

// Canonical message lifecycle statuses — keep in sync with types/index.ts MessageStatus
export const MESSAGE_STATUS = {
  WAITING:  "waiting",
  SENT:     "sent",
  SEEN:     "seen",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  EXPIRED:  "expired",
  INVALID:  "invalid",
} as const;

export const CREDIT_AMOUNTS = {
  SIGNUP_BONUS: 100,
  REFERRAL_REWARD: 50,
  REFERRAL_BONUS: 25,
  DAILY_LOGIN: 5,
  MESSAGE_COST: 1,
  MIN_PURCHASE: 100,
  MAX_PURCHASE: 10_000,
} as const;

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 32,
  MESSAGE_MAX_LENGTH: 2_000,
  BIO_MAX_LENGTH: 500,
  PHONE_MIN_LENGTH: 7,
  PHONE_MAX_LENGTH: 15,
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export const ERROR_MESSAGES = {
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_PASSWORD: "Password must be 8–128 characters with uppercase, number, and special character.",
  INVALID_PHONE: "Please enter a valid phone number.",
  INVALID_URL: "Please enter a valid URL.",
  USER_NOT_FOUND: "User not found.",
  UNAUTHORIZED: "You must be signed in to perform this action.",
  FORBIDDEN: "You do not have permission to perform this action.",
  INSUFFICIENT_CREDITS: "Insufficient credits to complete this action.",
  MESSAGE_TOO_LONG: `Message cannot exceed ${2_000} characters.`,
  FILE_TOO_LARGE: `File size cannot exceed ${10} MB.`,
  INVALID_FILE_TYPE: "File type not supported.",
  INTERNAL_ERROR: "Something went wrong. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
} as const;

export const API = {
  BASE_URL: process.env["NEXT_PUBLIC_API_URL"] ?? "/api",
  VERSION: "v1",
  TIMEOUT_MS: 10_000,
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
      DETAIL: (id: string) => `/users/${id}`,
      UPDATE: (id: string) => `/users/${id}`,
    },
    MESSAGES: {
      LIST: "/messages",
      SEND: "/messages",
      DETAIL: (id: string) => `/messages/${id}`,
    },
    CREDITS: {
      BALANCE: "/credits/balance",
      PURCHASE: "/credits/purchase",
      HISTORY: "/credits/history",
    },
  },
} as const;
