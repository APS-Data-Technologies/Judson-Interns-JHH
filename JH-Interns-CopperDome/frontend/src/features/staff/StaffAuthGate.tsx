import { useEffect, useState, type ReactNode } from 'react';
import { staffLogin } from '../../lib/api';
import { getStaffToken, onAuthExpired, setStaffToken } from '../../lib/auth';

/**
 * Gates every staff screen behind a real account (scope 5.6). The floor view, kitchen
 * display, and analytics expose every table's activity and the whole trial event log, so
 * they are never reachable with a patron token.
 */
export default function StaffAuthGate({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStaffToken());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A revoked or rotated staff token should return the server to sign-in, not leave the
  // floor view silently failing to refresh.
  useEffect(
    () =>
      onAuthExpired((scope) => {
        if (scope === 'staff') setToken(null);
      }),
    []
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const issued = await staffLogin(username.trim(), password);
      setStaffToken(issued);
      setToken(issued);
    } catch {
      setError('Those credentials were not accepted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (token) {
    return (
      <>
        {children}
        <div className="staff-signout">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setStaffToken(null);
              setToken(null);
            }}
          >
            Sign out
          </button>
        </div>
      </>
    );
  }

  return (
    <section className="screen screen--center screen--no-nav">
      <form className="glass-panel card-body staff-login" onSubmit={handleSubmit}>
        <div>
          <p className="label-md" style={{ color: 'var(--color-primary-container)' }}>
            Copper Dome
          </p>
          <h1 className="headline-md" style={{ marginTop: 6 }}>
            Staff sign in
          </h1>
          <p className="label-sm" style={{ marginTop: 6 }}>
            Floor view, kitchen display, and trial analytics.
          </p>
        </div>

        <label className="staff-login__field">
          <span className="label-sm">Username</span>
          <input
            className="input"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="staff-login__field">
          <span className="label-sm">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {error && (
          <p className="body-md" role="alert" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
