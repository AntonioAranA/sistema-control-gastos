import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';

interface Props {
  loading: boolean;
  error: string;
  onLogin: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  onRegister: (email: string, password: string, rememberMe: boolean) => Promise<void>;
}
export function AuthScreen({ loading, error, onLogin, onRegister }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <div className="brand-mark">
          <LockKeyhole />
        </div>
        <p className="eyebrow">Finanzas personales</p>
        <h1>{mode === 'login' ? 'Inicia sesión' : 'Crea tu cuenta'}</h1>
        <p>Tus movimientos y presupuestos quedarán protegidos en tu cuenta.</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void (mode === 'login'
              ? onLogin(email, password, rememberMe)
              : onRegister(email, password, rememberMe));
          }}
        >
          <label>
            Correo electrónico
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="remember-session">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>
              <strong>Mantener sesión iniciada</strong>
              <small>En este dispositivo, incluso al cerrar el navegador.</small>
            </span>
          </label>
          <label>
            Contraseña
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 10 : 1}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button primary" disabled={loading}>
            {loading ? 'Espera…' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
        <button
          className="text-button"
          onClick={() => setMode((value) => (value === 'login' ? 'register' : 'login'))}
        >
          {mode === 'login' ? 'Crear una cuenta' : 'Ya tengo una cuenta'}
        </button>
      </section>
    </main>
  );
}
