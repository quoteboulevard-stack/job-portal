import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';
import type { LoginPayload } from '../types';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (payload: LoginPayload) => {
    const result = await login(payload);
    if ((result as any).error) throw new Error((result as any).error.message);
    navigate('/dashboard');
  };

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md">
        <LoginForm onSubmit={handleSubmit} />
      </div>
    </main>
  );
}
