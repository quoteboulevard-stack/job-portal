import { FormEvent, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type Props = { onSubmit?: (payload: { email: string; password: string }) => void | Promise<void> };
type Errors = { email?: string; password?: string; form?: string };

export default function LoginForm({ onSubmit }: Props) {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement | null>(null), passwordRef = useRef<HTMLInputElement | null>(null);
  const [email, setEmail] = useState(""), [password, setPassword] = useState(""), [loading, setLoading] = useState(false), [errors, setErrors] = useState<Errors>({});
  const validate = () => {
    const next: Errors = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Enter your password.";
    else if (password.length < 8) next.password = "Use at least 8 characters.";
    return next;
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    if (next.email || next.password) {
      setErrors(next);
      (next.email ? emailRef : passwordRef).current?.focus();
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await onSubmit?.({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : "Login failed. Check your credentials and try again." });
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="mx-auto grid max-w-md gap-4 rounded-lg border border-border-gray bg-bg-white p-6">
      <h1 className="m-0 text-2xl font-bold text-gray-900">Login</h1>
      {errors.form && <div role="alert" aria-live="polite" aria-atomic="true" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errors.form}</div>}
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">Email Address</label>
        <input ref={emailRef} id="email" type="email" name="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((s) => ({ ...s, email: undefined })); }} placeholder="you@example.com" required autoComplete="email" spellCheck={false} aria-label="Email address" className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200" />
        {errors.email && <p className="mt-1 text-sm text-red-700">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-700">Password</label>
        <input ref={passwordRef} id="password" type="password" name="password" value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((s) => ({ ...s, password: undefined })); }} placeholder="At least 8 characters\u2026" required autoComplete="current-password" aria-label="Password" className="w-full rounded-lg border-2 border-gray-300 px-4 py-2.5 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-200" />
        {errors.password && <p className="mt-1 text-sm text-red-700">{errors.password}</p>}
      </div>
      <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition-colors duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400">{loading ? "Logging in\u2026" : "Login"}</button>
      <div className="text-center">
        <Link to="/forgot-password" className="rounded-lg px-1 text-sm text-blue-600 transition-colors duration-200 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">Forgot password?</Link>
      </div>
      <div className="text-center text-sm text-gray-600">
        Don&apos;t have an account? <Link to="/signup" className="rounded-lg px-1 text-blue-600 transition-colors duration-200 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">Sign up</Link>
      </div>
    </form>
  );
}
