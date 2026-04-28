/**
 * Firebase Cloud Functions entry point.
 * Firebase requires a single `main` module that exports every function.
 * Add new functions here as they are created.
 */

// ─── AI ───────────────────────────────────────────────────────────────────────
export { fitScore }      from './ai/fitScore';
export { missingSkills } from './ai/missingSkills';

// ─── Applications ─────────────────────────────────────────────────────────────
export { createApplication }       from './applications/createApplication';
export { updateApplicationStatus } from './applications/updateApplicationStatus';

// ─── Jobs ─────────────────────────────────────────────────────────────────────
export { createJob } from './jobs/createJob';

// ─── Admin ────────────────────────────────────────────────────────────────────
export {
  getAdminStats,
  listAdminUsers,
  listAdminJobs,
  deleteAdminJob,
  listAdminApplications,
  deleteAdminApplication,
  listAdminMessages,
  deleteAdminMessage,
  listAdminCreditTransactions,
} from './admin/adminOps';

// ─── Documents ────────────────────────────────────────────────────────────────
export { parseResume } from './documents/parseResume';
export { parseJD }     from './documents/parseJD';

// ─── Admin ────────────────────────────────────────────────────────────────────
export { setUserRole } from './admin/setUserRole';

// ─── Users ────────────────────────────────────────────────────────────────────
export { initUserCredits } from './users/initUserCredits';

// ─── Credits ──────────────────────────────────────────────────────────────────
export { deductCredit } from './credits/deductCredit';

// ─── Messaging ────────────────────────────────────────────────────────────────
export { sendMessage }      from './messaging/sendMessage';
export { requestMessage }   from './messaging/requestMessage';
export { markMessageSeen }  from './messaging/markMessageSeen';
export { acceptMessage }    from './messaging/acceptMessage';
export { rejectMessage }    from './messaging/rejectMessage';
export { sendChatMessage }  from './messaging/sendChatMessage';

// ─── Payments ─────────────────────────────────────────────────────────────────
export { createCreditCheckoutSession } from './payments/createCreditCheckoutSession';
export { stripeWebhook }   from './payments/stripeWebhook';
export { razorpayWebhook } from './payments/razorpayWebhook';

// ─── Scheduled ────────────────────────────────────────────────────────────────
export { refundExpiredMessages } from './scheduled/refundExpiredMessages';
export { cleanupOldData }        from './scheduled/cleanupOldData';
