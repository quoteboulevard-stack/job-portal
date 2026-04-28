"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = void 0;
exports.isAppError = isAppError;
exports.toAppError = toAppError;
class AppError extends Error {
    constructor(message, code, statusCode = 500, isOperational = true) {
        var _a;
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        (_a = Error.captureStackTrace) === null || _a === void 0 ? void 0 : _a.call(Error, this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, fields) {
        super(message, "VALIDATION_ERROR", 400);
        this.fields = fields;
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AppError {
    constructor(resource) { super(`${resource} not found`, "NOT_FOUND", 404); }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") { super(message, "UNAUTHORIZED", 401); }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "Forbidden") { super(message, "FORBIDDEN", 403); }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message) { super(message, "CONFLICT", 409); }
}
exports.ConflictError = ConflictError;
function isAppError(err) {
    return err instanceof AppError;
}
function toAppError(err) {
    if (isAppError(err))
        return err;
    const message = err instanceof Error ? err.message : String(err);
    return new AppError(message, "INTERNAL_ERROR", 500, false);
}
//# sourceMappingURL=errorHandler.js.map