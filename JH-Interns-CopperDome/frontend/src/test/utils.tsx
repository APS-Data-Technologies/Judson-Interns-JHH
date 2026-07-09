import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from '../lib/session';
import { CartProvider } from '../lib/cart';
import { ToastProvider } from '../lib/toast';
import type { CartLine, Kitchen, MenuItem } from '../lib/types';

export const SESSION_STORAGE_KEY = 'copperdome.session';
export const CART_STORAGE_KEY = 'copperdome.cart';

export function seedSession(overrides: Partial<Record<string, unknown>> = {}) {
  const session = {
    sessionId: 'test-session-id',
    tableNumber: '04',
    venueId: 1,
    venueName: 'Copper Dome Concierge',
    startedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function seedCart(lines: CartLine[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
}

export function readCart(): CartLine[] {
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function makeMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 1,
    kitchen: 1,
    name: 'Smoked Clam Chowder',
    description: 'House-smoked clams, roasted corn, potato, sourdough croutons',
    price: '9.00',
    category: 'Starters',
    dietary_tags: ['V', 'GF'],
    ...overrides,
  };
}

export function makeKitchen(overrides: Partial<Kitchen> = {}): Kitchen {
  return {
    id: 1,
    venue: 1,
    name: 'The Copper Rail Kitchen',
    cuisine_type: 'American coastal comfort',
    description: 'Grilled, smoked and wood-fired comfort food.',
    ...overrides,
  };
}

interface RouteSpec {
  path: string;
  element: ReactElement;
}

interface RenderRouteOptions {
  route: string;
  routes: RouteSpec[];
}

export function renderAtRoute({ route, routes }: RenderRouteOptions) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <SessionProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {routes.map((r) => (
                <Route key={r.path} path={r.path} element={r.element} />
              ))}
            </Routes>
          </ToastProvider>
        </CartProvider>
      </SessionProvider>
    </MemoryRouter>
  );
}
