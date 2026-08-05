import axios from 'axios';
import type {
  AnalyticsSummary,
  CartLine,
  ConciergeChatMessage,
  EventType,
  Kitchen,
  KitchenStation,
  MenuItem,
  Order,
  OrderStatus,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestType,
  TableState,
  Venue,
} from './types';

import { authHeader, notifyAuthExpired, setPatronToken } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach whichever credential this device holds (scope 5.6). Kept in an interceptor so a
// newly issued token applies immediately, without re-creating the client.
api.interceptors.request.use((config) => {
  Object.entries(authHeader()).forEach(([key, value]) => {
    config.headers.set(key, value);
  });
  return config;
});

// A 401 means the credential is gone or expired — not that the action was invalid. Clear
// it and tell the app, so the user is returned to the splash (or staff sign-in) instead
// of being stranded on a screen where every tap fails.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const sent = String(error.config?.headers?.Authorization ?? '');
      // The login endpoint 401s on a wrong password; that isn't an expired credential.
      const isLogin = String(error.config?.url ?? '').includes('/staff/login/');
      if (!isLogin) {
        notifyAuthExpired(sent.startsWith('Token ') ? 'staff' : 'patron');
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export interface StartedSession {
  session_id: string;
  token: string;
  table_number: string;
  analytics_opt_in: boolean;
  venue_id: number | null;
  venue_name: string;
}

/**
 * Mint a patron session for a QR-scanned table. This is the only patron endpoint that
 * needs no credential — it is what issues one. `analyticsOptIn` carries the patron's
 * answer to the trial consent prompt; the server writes no events without it.
 */
export async function startPatronSession(
  tableNumber: string,
  analyticsOptIn = false,
): Promise<StartedSession> {
  const response = await api.post<StartedSession>('/menu/sessions/start/', {
    table_number: tableNumber,
    analytics_opt_in: analyticsOptIn,
  });
  setPatronToken(response.data.token);
  return response.data;
}

export interface ConsentState {
  analytics_opt_in: boolean;
  event_count: number;
  events_removed?: number;
}

/**
 * Change this session's trial consent. Opting out also deletes the events already
 * recorded for the session — withdrawing consent should remove the data, not just stop
 * collecting more.
 */
export async function setSessionConsent(optIn: boolean): Promise<ConsentState> {
  const response = await api.post<ConsentState>('/menu/sessions/consent/', {
    analytics_opt_in: optIn,
  });
  return response.data;
}

export async function staffLogin(username: string, password: string): Promise<string> {
  const response = await api.post<{ token: string }>('/staff/login/', { username, password });
  return response.data.token;
}

export async function fetchVenues(): Promise<Venue[]> {
  const response = await api.get<Venue[]>('/menu/venues/');
  return response.data;
}

export async function fetchKitchens(): Promise<Kitchen[]> {
  const response = await api.get<Kitchen[]>('/menu/kitchens/');
  return response.data;
}

export async function fetchMenuItems(kitchenId?: number): Promise<MenuItem[]> {
  const response = await api.get<MenuItem[]>('/menu/menu-items/', {
    params: kitchenId ? { kitchen: kitchenId } : undefined,
  });
  return response.data;
}

export async function fetchMenuItem(id: number): Promise<MenuItem> {
  const response = await api.get<MenuItem>(`/menu/menu-items/${id}/`);
  return response.data;
}

export interface LogEventInput {
  eventType: EventType;
  sessionId: string;
  metadata?: Record<string, unknown>;
}

export async function logEvent({ eventType, sessionId, metadata = {} }: LogEventInput): Promise<void> {
  try {
    await api.post('/menu/events/', {
      event_type: eventType,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      metadata,
    });
  } catch {
    // Event logging is best-effort — a failed analytics call should never block the patron flow.
  }
}

export async function askConcierge(
  sessionId: string,
  message: string,
  history: ConciergeChatMessage[] = []
): Promise<string> {
  const response = await api.post<{ reply: string }>('/concierge/ask/', {
    session_id: sessionId,
    message,
    history,
  });
  return response.data.reply;
}

export async function createServiceRequest(
  sessionId: string,
  tableNumber: string,
  requestType: ServiceRequestType
): Promise<ServiceRequest> {
  const response = await api.post<ServiceRequest>('/service-requests/', {
    session_id: sessionId,
    table_number: tableNumber,
    request_type: requestType,
  });
  return response.data;
}

export async function fetchServiceRequests(status?: ServiceRequestStatus): Promise<ServiceRequest[]> {
  const response = await api.get<ServiceRequest[]>('/service-requests/', {
    params: status ? { status } : undefined,
  });
  return response.data;
}

export async function updateServiceRequestStatus(
  id: number,
  status: ServiceRequestStatus
): Promise<ServiceRequest> {
  const response = await api.patch<ServiceRequest>(`/service-requests/${id}/`, { status });
  return response.data;
}

/** This session's own orders, newest first. Scoped server-side by the patron token. */
export async function fetchMyOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>('/menu/orders/mine/');
  return response.data;
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const response = await api.get<AnalyticsSummary>('/menu/analytics/');
  return response.data;
}

/** Per-table state for the floor view (scope 3.4). */
export async function fetchTableStates(): Promise<TableState[]> {
  const response = await api.get<{ tables: TableState[] }>('/menu/tables/');
  return response.data.tables;
}

/** Open tickets grouped by the kitchen that has to cook them. */
export async function fetchKitchenDisplay(): Promise<KitchenStation[]> {
  const response = await api.get<{ stations: KitchenStation[] }>('/menu/kitchen-display/');
  return response.data.stations;
}

export async function advanceOrder(orderId: number): Promise<void> {
  await api.post(`/menu/orders/${orderId}/advance/`);
}

export interface CreateOrderInput {
  sessionId: string;
  tableNumber: string;
  total: number;
  lines: CartLine[];
  /** `declined` records a failed mock checkout; it never reaches the kitchen. */
  status?: OrderStatus;
}

/**
 * Record the simulated order so the kitchen display has a ticket. Nothing is charged —
 * checkout stays mocked (scope 4).
 */
export async function createOrder({
  sessionId,
  tableNumber,
  total,
  lines,
  status = 'placed',
}: CreateOrderInput): Promise<void> {
  await api.post('/menu/orders/', {
    session_id: sessionId,
    table_number: tableNumber,
    total: total.toFixed(2),
    status,
    items: lines.map((line) => ({
      menu_item: line.menuItem.id,
      kitchen: line.menuItem.kitchen,
      kitchen_name: line.kitchenName,
      name: line.menuItem.name,
      price: line.menuItem.price,
      quantity: line.quantity,
    })),
  });
}
