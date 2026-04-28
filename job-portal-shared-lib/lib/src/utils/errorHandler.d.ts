export type ErrorCode = "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "CONFLICT" | "INTERNAL_ERROR" | "NETWORK_ERROR" | "TIMEOUT";
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, code: ErrorCode, statusCode?: number, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    readonly fields?: Record<string, string>;
    constructor(message: string, fields?: Record<string, string>);
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string);
}
export declare function isAppError(err: unknown): err is AppError;
export declare function toAppError(err: unknown): AppError;
//# sourceMappingURL=errorHandler.d.ts.map