export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, code: ErrorCode, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly fields?: Record<string, string>;
  constructor(message: string, fields?: Record<string, string>) {
    super(message, "VALIDATION_ERROR", 400);
    this.fields = fields;
  }
}
export class NotFoundError extends AppError {
  constructor(resource: string) { super(`${resource} not found`, "NOT_FOUND", 404); }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") { super(message, "UNAUTHORIZED", 401); }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") { super(message, "FORBIDDEN", 403); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, "CONFLICT", 409); }
}

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toAppError(err: unknown): AppError {
  if (isAppError(err)) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new AppError(message, "INTERNAL_ERROR", 500, false);
}
