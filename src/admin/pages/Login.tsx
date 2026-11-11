import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { isDemoMode } from '@/lib/env';
import { signIn } from '@/services/auth';
import styles from '../admin.module.css';

export default function Login() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; denied?: boolean } | null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<Error | null>(state?.denied ? new Error('Esta cuenta no tiene acceso al panel.') : null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Acceso — Agatha Valladar';
  }, []);

  if (!loading && session && !state?.denied) return <Navigate to={state?.from ?? '/admin'} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError(new Error('Introduce tu email y tu contraseña.'));
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(state?.from ?? '/admin', { replace: true });
    } catch (err) {
      setError(err as Error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <div className={styles.loginCard}>
        <p className={styles.loginBrand}>AGATHA VALLADAR</p>
        <h1 className={styles.loginTitle}>Acceso privado</h1>
        <p className={styles.loginText}>Panel de publicación. Solo para la administradora.</p>

        {isDemoMode ? (
          <div style={{ marginTop: '1.5rem' }}>
            <ErrorState error={new Error('La web está en modo demostración: configura Supabase para usar el panel.')} />
          </div>
        ) : (
          <form className={styles.loginForm} onSubmit={onSubmit} noValidate>
            {error && <ErrorState error={error} />}
            <div className={styles.field}>
              <label htmlFor="email" className={styles.fieldLabel}>Email</label>
              <input id="email" type="email" autoComplete="username" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div className={styles.field}>
              <label htmlFor="password" className={styles.fieldLabel}>Contraseña</label>
              <input id="password" type="password" autoComplete="current-password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" variant="primary" loading={submitting}>Entrar</Button>
          </form>
        )}
        <p className={styles.loginFooter}>
          <Link to="/">← Volver a la web</Link>
        </p>
      </div>
    </main>
  );
}
