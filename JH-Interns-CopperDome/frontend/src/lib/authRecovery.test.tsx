import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider, useSession } from './session';
import { getPatronToken, notifyAuthExpired, setPatronToken } from './auth';
import RequireSession from '../components/RequireSession';
import { SESSION_STORAGE_KEY, seedSession } from '../test/utils';

vi.mock('./api');

function Protected() {
  const { session } = useSession();
  return <div>PROTECTED {session?.tableNumber}</div>;
}

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<div>SPLASH</div>} />
          <Route
            path="/home"
            element={
              <RequireSession>
                <Protected />
              </RequireSession>
            }
          />
        </Routes>
      </SessionProvider>
    </MemoryRouter>
  );
}

describe('patron credential recovery', () => {
  beforeEach(() => {
    setPatronToken(null);
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  });

  afterEach(() => {
    setPatronToken(null);
  });

  it('discards a stored session that has no token', () => {
    // Regression: sessions saved before the app required tokens had no credential, so the
    // patron got in and then every write 401'd with a dead-end error. Simulate that by
    // dropping the token the seed helper issues.
    seedSession({ tableNumber: '04' });
    setPatronToken(null);

    renderApp();

    expect(screen.getByText('SPLASH')).toBeInTheDocument();
    expect(screen.queryByText(/PROTECTED/)).not.toBeInTheDocument();
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('keeps a stored session that does have a token', () => {
    seedSession({ tableNumber: '04' });
    setPatronToken('valid-token');

    renderApp();

    expect(screen.getByText(/PROTECTED/)).toBeInTheDocument();
  });

  it('returns the patron to the splash when the token expires mid-session', async () => {
    seedSession({ tableNumber: '04' });
    setPatronToken('valid-token');
    renderApp();
    expect(screen.getByText(/PROTECTED/)).toBeInTheDocument();

    // A 401 on any ordinary tap (expired 6h token) triggers this.
    notifyAuthExpired('patron');

    expect(await screen.findByText('SPLASH')).toBeInTheDocument();
    await waitFor(() => expect(getPatronToken()).toBeNull());
    expect(window.localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });

  it('leaves the patron session alone when a staff token expires', () => {
    seedSession({ tableNumber: '04' });
    setPatronToken('valid-token');
    renderApp();

    notifyAuthExpired('staff');

    expect(screen.getByText(/PROTECTED/)).toBeInTheDocument();
    expect(getPatronToken()).toBe('valid-token');
  });
});
