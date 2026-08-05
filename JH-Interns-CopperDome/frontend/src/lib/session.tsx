import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setSessionConsent, startPatronSession } from './api';
import { getPatronToken, onAuthExpired } from './auth';

const STORAGE_KEY = 'copperdome.session';

export interface SessionState {
  sessionId: string;
  tableNumber: string;
  venueId: number | null;
  venueName: string;
  /** Whether this patron agreed to be instrumented during the trial. */
  analyticsOptIn: boolean;
  startedAt: string;
}

interface SessionContextValue {
  session: SessionState | null;
  /**
   * `analyticsOptIn` records the patron's answer to the trial consent prompt. It is
   * passed to the server, which refuses to write any event for a session that declined.
   */
  startSession: (tableNumber?: string, analyticsOptIn?: boolean) => Promise<SessionState>;
  /** Change consent mid-session. Opting out also deletes this session's events. */
  updateConsent: (optIn: boolean) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function readStoredSession(): SessionState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    // A session is only usable with the token that authenticates it. Sessions stored
    // before the app required tokens have none, and would otherwise let a patron into
    // the app where every write silently 401s.
    if (!getPatronToken()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return JSON.parse(raw) as SessionState;
  } catch {
    return null;
  }
}

function defaultTableNumber(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('table') || '04';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(() => readStoredSession());

  useEffect(() => {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }
  }, [session]);

  // If the patron token expires mid-meal, drop the session so RequireSession returns the
  // patron to the splash to rescan, rather than leaving them tapping dead buttons.
  useEffect(
    () =>
      onAuthExpired((scope) => {
        if (scope !== 'patron') return;
        window.localStorage.removeItem(STORAGE_KEY);
        setSession(null);
      }),
    []
  );

  const startSession = useCallback(async (tableNumber?: string, analyticsOptIn = false) => {
    const table = tableNumber || defaultTableNumber();

    // The server mints the session id and its bearer token, and writes session_started
    // itself — the client can no longer invent a session id (scope 5.6).
    const started = await startPatronSession(table, analyticsOptIn);

    const next: SessionState = {
      sessionId: started.session_id,
      tableNumber: started.table_number || table,
      venueId: started.venue_id,
      venueName: started.venue_name,
      analyticsOptIn: started.analytics_opt_in,
      startedAt: new Date().toISOString(),
    };

    setSession(next);
    return next;
  }, []);

  const updateConsent = useCallback(async (optIn: boolean) => {
    const result = await setSessionConsent(optIn);
    setSession((current) =>
      current ? { ...current, analyticsOptIn: result.analytics_opt_in } : current
    );
  }, []);

  const value = useMemo(
    () => ({ session, startSession, updateConsent }),
    [session, startSession, updateConsent]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
