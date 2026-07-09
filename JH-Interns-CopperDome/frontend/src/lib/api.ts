import axios from 'axios';
import type { EventType, Kitchen, MenuItem, Venue } from './types';

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
