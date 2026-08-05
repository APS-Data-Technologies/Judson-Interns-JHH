import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from '../lib/session';
import { CartProvider } from '../lib/cart';
import { ToastProvider } from '../lib/toast';
import type { CartLine, Kitchen, MenuItem, Order, ServiceRequest } from '../lib/types';
import { setPatronToken } from '../lib/auth';

export const SESSION_STORAGE_KEY = 'copperdome.session';
export const CART_STORAGE_KEY = 'copperdome.cart';

export function seedSession(overrides: Partial<Record<string, unknown>> = {}) {
  const session = {
    sessionId: 'test-session-id',
    tableNumber: '04',
    venueId: 1,
    venueName: 'Copper Dome Concierge',
    analyticsOptIn: true,
    startedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  // A real session is always issued alongside its bearer token; the app discards a
  // stored session that has none. Seed both so tests match production.
  setPatronToken('test-patron-token');
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

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 7,
    session_id: 'test-session-id',
    table_number: '04',
    status: 'placed',
    total: '25.00',
    created_at: '2026-08-06T20:00:00.000Z',
    items: [
      {
        id: 1,
        menu_item: 1,
        kitchen: 1,
        kitchen_name: 'The Copper Rail Kitchen',
        name: 'Smoked Clam Chowder',
        price: '9.00',
        quantity: 1,
      },
      {
        id: 2,
        menu_item: 12,
        kitchen: 2,
        kitchen_name: 'Dome Garden Kitchen',
        name: 'Crispy Chickpea Bites',
        price: '8.00',
        quantity: 2,
      },
    ],
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

export function makeServiceRequest(overrides: Partial<ServiceRequest> = {}): ServiceRequest {
  return {
    id: 1,
    session_id: 'test-session-id',
    table_number: '04',
    request_type: 'water',
    status: 'pending',
    created_at: '2026-01-01T00:00:00.000Z',
    resolved_at: null,
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
