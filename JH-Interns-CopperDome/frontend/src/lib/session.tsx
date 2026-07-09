import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchVenues, logEvent } from './api';

const STORAGE_KEY = 'copperdome.session';

export interface SessionState {
  sessionId: string;
  tableNumber: string;
  venueId: number | null;
  venueName: string;
  startedAt: string;
}

interface SessionContextValue {
  session: SessionState | null;
  startSession: (tableNumber?: string) => Promise<SessionState>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function readStoredSession(): SessionState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionState) : null;
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

  const startSession = useCallback(async (tableNumber?: string) => {
    const sessionId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    let venueId: number | null = null;
    let venueName = 'Copper Dome';
    try {
      const venues = await fetchVenues();
      if (venues[0]) {
        venueId = venues[0].id;
        venueName = venues[0].name;
      }
    } catch {
      // Fall back to the default venue label if the API is unreachable — the
      // session should still start so the patron isn't blocked.
    }

    const next: SessionState = {
      sessionId,
      tableNumber: tableNumber || defaultTableNumber(),
      venueId,
      venueName,
      startedAt: new Date().toISOString(),
    };

    setSession(next);
    await logEvent({
      eventType: 'session_started',
      sessionId: next.sessionId,
      metadata: { table_number: next.tableNumber, venue_id: next.venueId },
    });

    return next;
  }, []);

  const value = useMemo(() => ({ session, startSession }), [session, startSession]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
