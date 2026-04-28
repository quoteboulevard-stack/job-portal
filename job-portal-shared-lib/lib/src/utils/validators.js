"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidEmail = isValidEmail;
exports.isValidPassword = isValidPassword;
exports.isValidPhone = isValidPhone;
exports.isValidURL = isValidURL;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,15}$/;
const URL_RE = /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/;
function isValidEmail(value) {
    return EMAIL_RE.test(value.trim());
}
function isValidPassword(value, policy = { minLength: 8, requireUppercase: true, requireNumber: true, requireSpecial: true }) {
    var _a;
    if (value.length < ((_a = policy.minLength) !== null && _a !== void 0 ? _a : 8))
        return false;
    if (policy.requireUppercase && !/[A-Z]/.test(value))
        return false;
    if (policy.requireNumber && !/\d/.test(value))
        return false;
    if (policy.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value))
        return false;
    return true;
}
function isValidPhone(value) {
    return PHONE_RE.test(value.trim());
}
function isValidURL(value) {
    try {
        const url = new URL(value.trim());
        return url.protocol === "http:" || url.protocol === "https:";
    }
    catch (_a) {
        return false;
    }
}
//# sourceMappingURL=validators.js.map