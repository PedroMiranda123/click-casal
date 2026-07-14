import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

type Status = 'idle' | 'loading' | 'error_credentials' | 'error_rate_limit' | 'error_generic';

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  // Already authenticated — redirect to dashboard
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        navigate('/', { replace: true });
        return;
      }

      if (res.status === 429) {
        setStatus('error_rate_limit');
        return;
      }

      setStatus('error_credentials');
    } catch {
      setStatus('error_generic');
    }
  }

  const errorMessage = {
    error_credentials: 'E-mail ou senha incorretos.',
    error_rate_limit: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    error_generic: 'Não foi possível conectar. Verifique sua conexão.',
  }[status as Exclude<Status, 'idle' | 'loading'>] ?? null;

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-semibold mb-1" style={{ color: 'var(--ink)' }}>
            Click Casal
          </h1>
          <p className="text-sm" style={{ color: 'var(--ink-faint)' }}>
            Finanças do casal, juntos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-dim)' }}>
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl px-4 text-sm outline-none border transition-colors focus:border-[--gold]"
              style={{
                background: 'rgba(255,255,255,0.7)',
                borderColor: 'var(--glass-border)',
                color: 'var(--ink)',
              }}
              placeholder="voce@email.com"
              disabled={status === 'loading'}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: 'var(--ink-dim)' }}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl px-4 text-sm outline-none border transition-colors"
              style={{
                background: 'rgba(255,255,255,0.7)',
                borderColor: 'var(--glass-border)',
                color: 'var(--ink)',
              }}
              placeholder="••••••••"
              disabled={status === 'loading'}
            />
          </div>

          {errorMessage && (
            <p className="text-sm" style={{ color: 'var(--coral)' }} role="alert">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !email || !password}
            className="btn-primary w-full h-11 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Entrando…
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
