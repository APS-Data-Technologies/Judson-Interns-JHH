export interface Venue {
  id: number;
  name: string;
  address: string;
  configuration: Record<string, unknown>;
}

export interface Kitchen {
  id: number;
  venue: number;
  name: string;
  cuisine_type: string;
  description: string;
}

export interface MenuItem {
  id: number;
  kitchen: number;
  name: string;
  description: string;
  price: string;
  category: string;
  dietary_tags: string[];
}

export type EventType =
  | 'session_started'
  | 'menu_viewed'
  | 'menu_item_viewed'
  | 'ai_question_asked'
  | 'item_added_to_cart'
  | 'mock_checkout_started'
  | 'mock_checkout_completed'
  | 'service_request_created';

export interface CartLine {
  menuItem: MenuItem;
  kitchenName: string;
  quantity: number;
}

export type ServiceRequestType = 'call_server' | 'water' | 'check' | 'surprise_me';
export type ServiceRequestStatus = 'pending' | 'acknowledged' | 'resolved';

export interface ServiceRequest {
  id: number;
  session_id: string;
  table_number: string;
  request_type: ServiceRequestType;
  status: ServiceRequestStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface ConciergeChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnalyticsSummary {
  total_sessions: number;
  concierge_open_rate: number;
  ai_queries_per_session: number;
  request_types_by_frequency: Record<string, number>;
  menu_to_cart_drop_off: number;
  median_session_duration_seconds: number;
}
