"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.formatCurrency = formatCurrency;
exports.formatPercentage = formatPercentage;
exports.formatPhone = formatPhone;
exports.calculateDaysSince = calculateDaysSince;
exports.getDaysUntilExpiry = getDaysUntilExpiry;
function formatDate(date, locale = "en-US", options = { year: "numeric", month: "short", day: "numeric" }) {
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
}
function formatCurrency(amount, currency = "USD", locale = "en-US") {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}
function formatPercentage(value, decimals = 1, locale = "en-US") {
    return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value / 100);
}
function formatPhone(value) {
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    if (digits.length === 11 && digits[0] === "1") {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    return value;
}
function calculateDaysSince(date) {
    const ms = Date.now() - new Date(date).getTime();
    return Math.floor(ms / 86400000);
}
function getDaysUntilExpiry(expiryDate) {
    const ms = new Date(expiryDate).getTime() - Date.now();
    return Math.floor(ms / 86400000);
}
//# sourceMappingURL=formatters.js.map