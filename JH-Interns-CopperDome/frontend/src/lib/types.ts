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
  sessions_issued: number;
  sessions_opted_in: number;
  opt_in_rate: number;
  concierge_open_rate: number;
  ai_queries_per_session: number;
  request_types_by_frequency: Record<string, number>;
  menu_to_cart_drop_off: number;
  median_session_duration_seconds: number;
  event_counts: Record<EventType, number>;
  event_types_fired: number;
  event_types_total: number;
}

export type TableStatus = 'needs_attention' | 'order_open' | 'seated' | 'free';

export interface TableState {
  table_number: string;
  status: TableStatus;
  open_requests: number;
  oldest_request_at: string | null;
  open_orders: number;
  order_status: OrderStatus | null;
  last_activity: string | null;
}

export type OrderStatus = 'placed' | 'preparing' | 'ready' | 'served' | 'declined';

/** Still moving through the kitchen — what "Your Order" shows. */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = ['placed', 'preparing', 'ready'];

export interface OrderLine {
  name: string;
  quantity: number;
}

export interface KitchenTicket {
  order_id: number;
  table_number: string;
  status: OrderStatus;
  placed_at: string;
  lines: OrderLine[];
}

export interface OrderItemLine {
  id: number;
  menu_item: number | null;
  kitchen: number | null;
  kitchen_name: string;
  name: string;
  price: string;
  quantity: number;
}

export interface Order {
  id: number;
  session_id: string;
  table_number: string;
  status: OrderStatus;
  total: string;
  created_at: string;
  items: OrderItemLine[];
}

export interface KitchenStation {
  kitchen_id: number;
  kitchen_name: string;
  tickets: KitchenTicket[];
}
