import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Field, Input } from '../components/ui/Form';
import { BrandLogo } from '../components/ui/BrandLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/dashboard' : '/assistant/home', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const logged = await login(email, password);
      navigate(logged.role === 'ADMIN' ? '/dashboard' : '/assistant/home', { replace: true });
    } catch {
      setError('Credenciales inválidas. Verifica tu usuario y contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-petrol-200/30 blur-3xl dark:bg-petrol-500/10" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-petrol-200/20 blur-3xl dark:bg-petrol-500/8" />
        <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-petrol-100/35 blur-3xl dark:bg-petrol-500/10" />
      </div>
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <BrandLogo size="lg" />
          <p className="mt-3 text-sm text-muted">Panel administrativo privado</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="relative overflow-hidden rounded-panel bg-surface/90 p-6 shadow-elevated backdrop-blur-sm dark:bg-surface/95 dark:shadow-elevated-dark"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-petrol-400 to-transparent" />
          <div className="space-y-4 pt-1">
          <Field label="Usuario">
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="renacer"
              required
              autoFocus
            />
          </Field>
          <Field label="Contraseña">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}
