import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createServiceRequest, fetchMyOrders } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useToast } from '../../lib/toast';
import { formatPrice } from '../../lib/dietary';
import { ORDER_STATUS_COPY } from '../../lib/orderStatus';
import type { Order } from '../../lib/types';
import ScreenHeader from '../../components/ScreenHeader';
import { LoadingState } from '../../components/AsyncState';
import { IconBell, IconBot, IconCheck, IconClock } from '../../components/icons';

// The kitchen display advances tickets, so re-read to follow it without a socket.
const POLL_MS = 8000;

export default function OrderStatusPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { showToast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const orders = await fetchMyOrders();
      setOrder(orders[0] ?? null);
    } catch {
      // Keep the last known state — a dropped poll shouldn't blank the screen.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  const handleRequestService = async () => {
    if (!session) return;
    try {
      await createServiceRequest(session.sessionId, session.tableNumber, 'call_server');
      showToast('A server has been notified');
    } catch {
      showToast("Couldn't send that request — please flag down your server.");
    }
  };

  const stage = order ? ORDER_STATUS_COPY[order.status] : null;

  return (
    <section className="screen screen--center screen--no-nav">
      <ScreenHeader title="Order Status" />

      {isLoading && <LoadingState label="Checking with the kitchen..." />}

      {!isLoading && !order && (
        <>
          <div className="status-icon" style={{ width: 96, height: 96 }}>
            <IconClock width={40} height={40} />
          </div>
          <div>
            <h1 className="headline-lg" style={{ fontSize: 26 }}>
              No order yet
            </h1>
            <p className="body-md" style={{ marginTop: 12 }}>
              Once you place an order it will show up here, and you can follow it until it reaches
              the table.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/menu')}>
            Browse the menu
          </button>
        </>
      )}

      {!isLoading && order && stage && (
        <>
          <div className="status-icon" style={{ width: 96, height: 96 }}>
            {order.status === 'served' ? <IconCheck width={40} height={40} /> : <IconClock width={40} height={40} />}
          </div>

          <div>
            <h1 className="headline-lg" style={{ fontSize: 26 }}>
              {stage.title}
            </h1>
            <p className="body-md" style={{ marginTop: 12 }}>
              {stage.detail}
            </p>
          </div>

          <div className="card card-body" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label-sm">Order #{order.id}</span>
              <span className="chip">Table {order.table_number}</span>
            </div>

            <div className="progress-bar">
              <div className="progress-bar__fill" style={{ width: `${stage.percent}%` }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {order.items.map((line) => (
                <div key={line.id} className="summary-row">
                  <span>
                    {line.quantity}× {line.name}
                    <span className="label-sm" style={{ display: 'block' }}>
                      {line.kitchen_name}
                    </span>
                  </span>
                  <span>{formatPrice(Number(line.price) * line.quantity)}</span>
                </div>
              ))}
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
              Continue Browsing
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/concierge')}>
                <IconBot width={18} height={18} />
                Ask Concierge
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleRequestService}>
                <IconBell width={18} height={18} />
                Request Service
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/orders')}>
              View all my orders
            </button>
          </div>
        </>
      )}
    </section>
  );
}
