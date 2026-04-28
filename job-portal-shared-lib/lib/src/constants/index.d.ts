export declare const COLLECTIONS: {
    readonly USERS: "users";
    readonly MESSAGES: "messages";
    readonly CONVERSATIONS: "conversations";
    readonly JOBS: "jobs";
    readonly APPLICATIONS: "applications";
    readonly RESUMES: "resumes";
    readonly CREDITS: "credits";
    readonly NOTIFICATIONS: "notifications";
    readonly SESSIONS: "sessions";
    readonly AUDIT_LOGS: "auditLogs";
};
export declare const MESSAGE_STATUS: {
    readonly WAITING: "waiting";
    readonly SENT: "sent";
    readonly SEEN: "seen";
    readonly ACCEPTED: "accepted";
    readonly REJECTED: "rejected";
    readonly EXPIRED: "expired";
    readonly INVALID: "invalid";
};
export declare const CREDIT_AMOUNTS: {
    readonly SIGNUP_BONUS: 100;
    readonly REFERRAL_REWARD: 50;
    readonly REFERRAL_BONUS: 25;
    readonly DAILY_LOGIN: 5;
    readonly MESSAGE_COST: 1;
    readonly MIN_PURCHASE: 100;
    readonly MAX_PURCHASE: 10000;
};
export declare const VALIDATION: {
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly PASSWORD_MAX_LENGTH: 128;
    readonly USERNAME_MIN_LENGTH: 3;
    readonly USERNAME_MAX_LENGTH: 32;
    readonly MESSAGE_MAX_LENGTH: 2000;
    readonly BIO_MAX_LENGTH: 500;
    readonly PHONE_MIN_LENGTH: 7;
    readonly PHONE_MAX_LENGTH: 15;
    readonly MAX_FILE_SIZE_MB: 10;
    readonly ALLOWED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/webp"];
};
export declare const ERROR_MESSAGES: {
    readonly INVALID_EMAIL: "Please enter a valid email address.";
    readonly INVALID_PASSWORD: "Password must be 8–128 characters with uppercase, number, and special character.";
    readonly INVALID_PHONE: "Please enter a valid phone number.";
    readonly INVALID_URL: "Please enter a valid URL.";
    readonly USER_NOT_FOUND: "User not found.";
    readonly UNAUTHORIZED: "You must be signed in to perform this action.";
    readonly FORBIDDEN: "You do not have permission to perform this action.";
    readonly INSUFFICIENT_CREDITS: "Insufficient credits to complete this action.";
    readonly MESSAGE_TOO_LONG: "Message cannot exceed 2000 characters.";
    readonly FILE_TOO_LARGE: "File size cannot exceed 10 MB.";
    readonly INVALID_FILE_TYPE: "File type not supported.";
    readonly INTERNAL_ERROR: "Something went wrong. Please try again.";
    readonly NETWORK_ERROR: "Network error. Please check your connection.";
};
export declare const API: {
    readonly BASE_URL: string;
    readonly VERSION: "v1";
    readonly TIMEOUT_MS: 10000;
    readonly ENDPOINTS: {
        readonly AUTH: {
            readonly LOGIN: "/auth/login";
            readonly LOGOUT: "/auth/logout";
            readonly REGISTER: "/auth/register";
            readonly REFRESH: "/auth/refresh";
            readonly ME: "/auth/me";
        };
        readonly USERS: {
            readonly LIST: "/users";
            readonly DETAIL: (id: string) => string;
            readonly UPDATE: (id: string) => string;
        };
        readonly MESSAGES: {
            readonly LIST: "/messages";
            readonly SEND: "/messages";
            readonly DETAIL: (id: string) => string;
        };
        readonly CREDITS: {
            readonly BALANCE: "/credits/balance";
            readonly PURCHASE: "/credits/purchase";
            readonly HISTORY: "/credits/history";
        };
    };
};
//# sourceMappingURL=index.d.ts.map