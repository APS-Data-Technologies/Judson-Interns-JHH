import type { OrderStatus } from './types';

/**
 * How an order's kitchen status reads to the patron.
 *
 * The kitchen advances placed → preparing → ready → served on the kitchen display; this
 * is the patron-facing wording and progress for each step, so both screens stay in step
 * with one source of truth.
 */
export const ORDER_STATUS_COPY: Record<OrderStatus, { title: string; detail: string; percent: number }> = {
  placed: {
    title: 'Order received',
    detail: 'The kitchen has your order and will start shortly.',
    percent: 15,
  },
  preparing: {
    title: 'Being prepared',
    detail: 'Your dishes are on the pass now.',
    percent: 55,
  },
  ready: {
    title: 'Ready',
    detail: 'A server is bringing it over.',
    percent: 90,
  },
  served: {
    title: 'Served',
    detail: 'Enjoy — flag a server if you need anything else.',
    percent: 100,
  },
  declined: {
    title: 'Payment declined',
    detail: 'Nothing was charged and the kitchen never received it. You can order again.',
    percent: 0,
  },
};

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_COPY[status]?.title ?? status;
}
