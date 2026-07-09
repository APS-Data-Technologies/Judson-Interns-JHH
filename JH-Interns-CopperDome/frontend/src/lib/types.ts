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
