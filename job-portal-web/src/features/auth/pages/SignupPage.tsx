import { useNavigate } from 'react-router-dom';
import SignupForm from '../components/SignupForm';
import { useAuth } from '../hooks/useAuth';
import type { SignupPayload } from '../types';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (payload: SignupPayload) => {
    const result = await signup(payload);
    if ((result as any).error) throw new Error((result as any).error.message);
    navigate('/dashboard');
  };

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-lg">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Create Account</h1>
        <SignupForm onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
