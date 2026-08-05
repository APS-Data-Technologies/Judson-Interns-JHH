import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../lib/dietary';
import { ORDER_STATUS_COPY } from '../lib/orderStatus';
import { ACTIVE_ORDER_STATUSES, type Order } from '../lib/types';
import { IconClock } from './icons';

function placedAt(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Orders this table has placed, newest first. Tapping one opens its live status. */
export default function OrderList({ orders }: { orders: Order[] }) {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map((order) => {
        const stage = ORDER_STATUS_COPY[order.status];
        const isDeclined = order.status === 'declined';

        return (
          <article
            key={order.id}
            className={`card card-body order-card${isDeclined ? ' order-card--declined' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => navigate('/order-status')}
          >
            <div className="order-card__top">
              <span className="label-md">Order #{order.id}</span>
              <span
                className={`chip${
                  isDeclined
                    ? ' chip--declined'
                    : ACTIVE_ORDER_STATUSES.includes(order.status)
                      ? ' chip--live'
                      : ''
                }`}
              >
                {stage.title}
              </span>
            </div>

            <p className="label-sm">
              <IconClock width={12} height={12} /> {placedAt(order.created_at)} · Table {order.table_number}
            </p>

            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${stage.percent}%` }} />
            </div>

            <ul className="order-card__lines">
              {order.items.map((line) => (
                <li key={line.id}>
                  <span>
                    {line.quantity}× {line.name}
                  </span>
                  <span className="label-sm">{line.kitchen_name}</span>
                </li>
              ))}
            </ul>

            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
