export const validators = {
  email: (v: string): string | null =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : 'Enter a valid email address.',

  password: (v: string): string | null =>
    v.length >= 8 ? null : 'Password must be at least 8 characters.',

  passwordMatch: (a: string, b: string): string | null =>
    a === b ? null : 'Passwords do not match.',

  required: (label: string) => (v: string): string | null =>
    v.trim() ? null : `${label} is required.`,

  maxLength: (max: number, label: string) => (v: string): string | null =>
    v.length <= max ? null : `${label} must be ${max} characters or fewer.`,

  minLength: (min: number, label: string) => (v: string): string | null =>
    v.length >= min ? null : `${label} must be at least ${min} characters.`,
};
