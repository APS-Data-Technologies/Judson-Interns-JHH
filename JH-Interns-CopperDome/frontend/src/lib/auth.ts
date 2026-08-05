/**
 * Credential storage for the two audiences (scope 5.6).
 *
 * Patrons get a short-lived session token minted when they scan a table QR code; staff
 * sign in and get an API token. Both live in localStorage so a refresh mid-service does
 * not lose the session — neither contains personal data.
 */

const PATRON_TOKEN_KEY = 'copperdome.patronToken';
const STAFF_TOKEN_KEY = 'copperdome.staffToken';

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Private-mode browsers block storage; the app still works for this page view.
  }
}

export const getPatronToken = () => read(PATRON_TOKEN_KEY);
export const setPatronToken = (token: string | null) => write(PATRON_TOKEN_KEY, token);

export const getStaffToken = () => read(STAFF_TOKEN_KEY);
export const setStaffToken = (token: string | null) => write(STAFF_TOKEN_KEY, token);

/**
 * Staff credentials win when both are present — the staff screens are the only place a
 * staff token is used, and they must never be answered with patron-scoped data.
 */
export function authHeader(): Record<string, string> {
  const staff = getStaffToken();
  if (staff) return { Authorization: `Token ${staff}` };
  const patron = getPatronToken();
  if (patron) return { Authorization: `Patron ${patron}` };
  return {};
}

type AuthExpiredListener = (scope: 'patron' | 'staff') => void;

const listeners = new Set<AuthExpiredListener>();

/**
 * Notifies the app that a credential stopped working, so it can send the user back to
 * the right starting point instead of leaving them on a screen where every action fails.
 *
 * A patron's token expires after 6 hours, and a session stored before the app required
 * tokens has none at all — both surface as 401s on otherwise ordinary taps.
 */
export function onAuthExpired(listener: AuthExpiredListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyAuthExpired(scope: 'patron' | 'staff') {
  if (scope === 'patron') setPatronToken(null);
  else setStaffToken(null);
  listeners.forEach((listener) => listener(scope));
}
