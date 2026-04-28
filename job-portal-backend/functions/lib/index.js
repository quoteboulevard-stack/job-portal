"use strict";
/**
 * Firebase Cloud Functions entry point.
 * Firebase requires a single `main` module that exports every function.
 * Add new functions here as they are created.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldData = exports.refundExpiredMessages = exports.razorpayWebhook = exports.stripeWebhook = exports.createCreditCheckoutSession = exports.sendChatMessage = exports.rejectMessage = exports.acceptMessage = exports.markMessageSeen = exports.requestMessage = exports.sendMessage = exports.deductCredit = exports.setUserRole = exports.parseJD = exports.parseResume = exports.listAdminCreditTransactions = exports.deleteAdminMessage = exports.listAdminMessages = exports.deleteAdminApplication = exports.listAdminApplications = exports.deleteAdminJob = exports.listAdminJobs = exports.listAdminUsers = exports.getAdminStats = exports.createJob = exports.updateApplicationStatus = exports.createApplication = exports.missingSkills = exports.fitScore = void 0;
// ─── AI ───────────────────────────────────────────────────────────────────────
var fitScore_1 = require("./ai/fitScore");
Object.defineProperty(exports, "fitScore", { enumerable: true, get: function () { return fitScore_1.fitScore; } });
var missingSkills_1 = require("./ai/missingSkills");
Object.defineProperty(exports, "missingSkills", { enumerable: true, get: function () { return missingSkills_1.missingSkills; } });
// ─── Applications ─────────────────────────────────────────────────────────────
var createApplication_1 = require("./applications/createApplication");
Object.defineProperty(exports, "createApplication", { enumerable: true, get: function () { return createApplication_1.createApplication; } });
var updateApplicationStatus_1 = require("./applications/updateApplicationStatus");
Object.defineProperty(exports, "updateApplicationStatus", { enumerable: true, get: function () { return updateApplicationStatus_1.updateApplicationStatus; } });
// ─── Jobs ─────────────────────────────────────────────────────────────────────
var createJob_1 = require("./jobs/createJob");
Object.defineProperty(exports, "createJob", { enumerable: true, get: function () { return createJob_1.createJob; } });
// ─── Admin ────────────────────────────────────────────────────────────────────
var adminOps_1 = require("./admin/adminOps");
Object.defineProperty(exports, "getAdminStats", { enumerable: true, get: function () { return adminOps_1.getAdminStats; } });
Object.defineProperty(exports, "listAdminUsers", { enumerable: true, get: function () { return adminOps_1.listAdminUsers; } });
Object.defineProperty(exports, "listAdminJobs", { enumerable: true, get: function () { return adminOps_1.listAdminJobs; } });
Object.defineProperty(exports, "deleteAdminJob", { enumerable: true, get: function () { return adminOps_1.deleteAdminJob; } });
Object.defineProperty(exports, "listAdminApplications", { enumerable: true, get: function () { return adminOps_1.listAdminApplications; } });
Object.defineProperty(exports, "deleteAdminApplication", { enumerable: true, get: function () { return adminOps_1.deleteAdminApplication; } });
Object.defineProperty(exports, "listAdminMessages", { enumerable: true, get: function () { return adminOps_1.listAdminMessages; } });
Object.defineProperty(exports, "deleteAdminMessage", { enumerable: true, get: function () { return adminOps_1.deleteAdminMessage; } });
Object.defineProperty(exports, "listAdminCreditTransactions", { enumerable: true, get: function () { return adminOps_1.listAdminCreditTransactions; } });
// ─── Documents ────────────────────────────────────────────────────────────────
var parseResume_1 = require("./documents/parseResume");
Object.defineProperty(exports, "parseResume", { enumerable: true, get: function () { return parseResume_1.parseResume; } });
var parseJD_1 = require("./documents/parseJD");
Object.defineProperty(exports, "parseJD", { enumerable: true, get: function () { return parseJD_1.parseJD; } });
// ─── Admin ────────────────────────────────────────────────────────────────────
var setUserRole_1 = require("./admin/setUserRole");
Object.defineProperty(exports, "setUserRole", { enumerable: true, get: function () { return setUserRole_1.setUserRole; } });
// ─── Credits ──────────────────────────────────────────────────────────────────
var deductCredit_1 = require("./credits/deductCredit");
Object.defineProperty(exports, "deductCredit", { enumerable: true, get: function () { return deductCredit_1.deductCredit; } });
// ─── Messaging ────────────────────────────────────────────────────────────────
var sendMessage_1 = require("./messaging/sendMessage");
Object.defineProperty(exports, "sendMessage", { enumerable: true, get: function () { return sendMessage_1.sendMessage; } });
var requestMessage_1 = require("./messaging/requestMessage");
Object.defineProperty(exports, "requestMessage", { enumerable: true, get: function () { return requestMessage_1.requestMessage; } });
var markMessageSeen_1 = require("./messaging/markMessageSeen");
Object.defineProperty(exports, "markMessageSeen", { enumerable: true, get: function () { return markMessageSeen_1.markMessageSeen; } });
var acceptMessage_1 = require("./messaging/acceptMessage");
Object.defineProperty(exports, "acceptMessage", { enumerable: true, get: function () { return acceptMessage_1.acceptMessage; } });
var rejectMessage_1 = require("./messaging/rejectMessage");
Object.defineProperty(exports, "rejectMessage", { enumerable: true, get: function () { return rejectMessage_1.rejectMessage; } });
var sendChatMessage_1 = require("./messaging/sendChatMessage");
Object.defineProperty(exports, "sendChatMessage", { enumerable: true, get: function () { return sendChatMessage_1.sendChatMessage; } });
// ─── Payments ─────────────────────────────────────────────────────────────────
var createCreditCheckoutSession_1 = require("./payments/createCreditCheckoutSession");
Object.defineProperty(exports, "createCreditCheckoutSession", { enumerable: true, get: function () { return createCreditCheckoutSession_1.createCreditCheckoutSession; } });
var stripeWebhook_1 = require("./payments/stripeWebhook");
Object.defineProperty(exports, "stripeWebhook", { enumerable: true, get: function () { return stripeWebhook_1.stripeWebhook; } });
var razorpayWebhook_1 = require("./payments/razorpayWebhook");
Object.defineProperty(exports, "razorpayWebhook", { enumerable: true, get: function () { return razorpayWebhook_1.razorpayWebhook; } });
// ─── Scheduled ────────────────────────────────────────────────────────────────
var refundExpiredMessages_1 = require("./scheduled/refundExpiredMessages");
Object.defineProperty(exports, "refundExpiredMessages", { enumerable: true, get: function () { return refundExpiredMessages_1.refundExpiredMessages; } });
var cleanupOldData_1 = require("./scheduled/cleanupOldData");
Object.defineProperty(exports, "cleanupOldData", { enumerable: true, get: function () { return cleanupOldData_1.cleanupOldData; } });
//# sourceMappingURL=index.js.map