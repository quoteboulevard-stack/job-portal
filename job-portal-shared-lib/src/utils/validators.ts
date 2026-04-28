const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,15}$/;
const URL_RE = /^https?:\/\/([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export interface PasswordPolicy {
  minLength?: number;
  requireUppercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
}

export function isValidPassword(
  value: string,
  policy: PasswordPolicy = { minLength: 8, requireUppercase: true, requireNumber: true, requireSpecial: true }
): boolean {
  if (value.length < (policy.minLength ?? 8)) return false;
  if (policy.requireUppercase && !/[A-Z]/.test(value)) return false;
  if (policy.requireNumber && !/\d/.test(value)) return false;
  if (policy.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) return false;
  return true;
}

export function isValidPhone(value: string): boolean {
  return PHONE_RE.test(value.trim());
}

export function isValidURL(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
