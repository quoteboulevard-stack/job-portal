import { FormEvent, useState } from "react";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

type Props = { onSubmit?: (payload: { email: string; password: string; name: string; role: "job_seeker" | "employer"; location: string }) => void | Promise<void> };

export default function SignupForm({ onSubmit }: Props) {
  const [step, setStep] = useState(1), [email, setEmail] = useState(""), [password, setPassword] = useState(""), [confirm, setConfirm] = useState(""), [name, setName] = useState(""), [role, setRole] = useState<"job_seeker" | "employer">("job_seeker"), [location, setLocation] = useState(""), [loading, setLoading] = useState(false);
  const emailError = email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "Enter a valid email." : "";
  const passwordError = password && password.length < 8 ? "Password must be at least 8 characters." : "";
  const confirmError = confirm && confirm !== password ? "Passwords must match." : "";
  const nameError = step === 2 && !name ? "Name is required." : "";
  const locationError = step === 2 && !location ? "Location is required." : "";
  const next = () => { if (!emailError && !passwordError && !confirmError && email && password && confirm) setStep(2); };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (step === 1) return next();
    if (nameError || locationError || !name || !location) return;
    setLoading(true);
    try { await onSubmit?.({ email, password, name, role, location }); } finally { setLoading(false); }
  };
  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12, width: "100%" }}>
      {step === 1 ? <>
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" error={emailError} />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create password" error={passwordError} />
        <Input label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" error={confirmError} />
      </> : <>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" error={nameError} />
        <label style={{ display: "grid", gap: 6 }}><span style={{ color: "#6B7280", fontSize: 14, fontWeight: 700 }}>Role</span><select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as "job_seeker" | "employer")} style={{ padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8 }}><option value="job_seeker">Job Seeker</option><option value="employer">Employer</option></select></label>
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Your location" error={locationError} />
      </>}
      <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
        {step === 2 && <button type="button" onClick={() => setStep(1)} style={{ padding: "10px 16px", border: "1px solid #E5E7EB", borderRadius: 8, background: "#F3F4F6", color: "#6B7280" }}>Back</button>}
        <Button loading={loading} ariaLabel={step === 1 ? "Next" : "Create Account"}>{step === 1 ? "Next" : "Create Account"}</Button>
      </div>
    </form>
  );
}
