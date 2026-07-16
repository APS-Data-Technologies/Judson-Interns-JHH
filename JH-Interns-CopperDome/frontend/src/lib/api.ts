import axios from 'axios';
import type {
  AnalyticsSummary,
  ConciergeChatMessage,
  EventType,
  Kitchen,
  MenuItem,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestType,
  Venue,
} from './types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

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

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const response = await api.get<AnalyticsSummary>('/menu/analytics/');
  return response.data;
}
