import { httpsCallable } from "firebase/functions";
import { functions } from "./firebaseService";

type CallableResponse<T> = Promise<T>;

export function callMarkMessageSeen(messageId: string): CallableResponse<{ success: boolean; messageId: string; alreadySeen: boolean }> {
  return httpsCallable<{ messageId: string }, { success: boolean; messageId: string; alreadySeen: boolean }>(
    functions,
    "markMessageSeen"
  )({ messageId }).then((result) => result.data);
}

export function callAcceptMessage(messageId: string): CallableResponse<{ success: boolean; messageId: string; conversationId: string }> {
  return httpsCallable<{ messageId: string }, { success: boolean; messageId: string; conversationId: string }>(
    functions,
    "acceptMessage"
  )({ messageId }).then((result) => result.data);
}

export function callRejectMessage(
  messageId: string,
  reason: string
): CallableResponse<{ success: boolean; messageId: string }> {
  return httpsCallable<
    { messageId: string; reason: string },
    { success: boolean; messageId: string }
  >(functions, "rejectMessage")({ messageId, reason }).then((result) => result.data);
}

export function callRequestMessage(payload: {
  toUserId: string;
  subject: string;
  body: string;
}): CallableResponse<{ success: boolean; messageId: string }> {
  return httpsCallable<
    { toUserId: string; subject: string; body: string },
    { success: boolean; messageId: string }
  >(functions, "requestMessage")(payload).then((result) => result.data);
}

export function callCreateCreditCheckoutSession(payload: {
  packageId: string;
  origin: string;
}): CallableResponse<{ success: boolean; url: string }> {
  return httpsCallable<
    { packageId: string; origin: string },
    { success: boolean; url: string }
  >(functions, "createCreditCheckoutSession")(payload).then((result) => result.data);
}

export function callSetUserRole(payload: {
  uid: string;
  role: 'job_seeker' | 'employer' | 'admin';
}): CallableResponse<{ success: boolean }> {
  return httpsCallable<
    { uid: string; role: string },
    { success: boolean }
  >(functions, "setUserRole")(payload).then((result) => result.data);
}

export function callSendChatMessage(payload: {
  conversationId: string;
  text: string;
}): CallableResponse<{ success: boolean; messageId: string }> {
  return httpsCallable<typeof payload, { success: boolean; messageId: string }>(
    functions, "sendChatMessage"
  )(payload).then((result) => result.data);
}

export function callCreateJob(payload: {
  title: string;
  company: string;
  location: string;
  workMode: string;
  employmentType: string;
  experience: string;
  description: string;
  salary?: number | null;
  requirements?: string[];
  skills?: string[];
  perks?: string[];
}): CallableResponse<{ success: boolean; jobId: string }> {
  return httpsCallable<typeof payload, { success: boolean; jobId: string }>(
    functions, "createJob"
  )(payload).then((result) => result.data);
}

export function callCreateApplication(payload: {
  jobId: string;
}): CallableResponse<{ success: boolean; applicationId: string }> {
  return httpsCallable<
    typeof payload,
    { success: boolean; applicationId: string }
  >(functions, "createApplication")(payload).then((result) => result.data);
}

export function callUpdateApplicationStatus(payload: {
  applicationId: string;
  status: string;
}): CallableResponse<{ success: boolean; applicationId: string; status: string }> {
  return httpsCallable<
    typeof payload,
    { success: boolean; applicationId: string; status: string }
  >(functions, "updateApplicationStatus")(payload).then((result) => result.data);
}
