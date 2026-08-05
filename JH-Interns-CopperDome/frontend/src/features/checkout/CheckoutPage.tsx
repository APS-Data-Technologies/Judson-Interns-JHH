import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, logEvent } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useCart } from '../../lib/cart';
import { useComingSoon } from '../../lib/toast';
import { formatPrice } from '../../lib/dietary';
import ScreenHeader from '../../components/ScreenHeader';
import { IconCheck, IconFork } from '../../components/icons';

/**
 * Test flag for the mock-failure path. Set either during a demo:
 *   - `?fail=1` on the checkout URL, or
 *   - `VITE_MOCK_CHECKOUT_FAILS=true` at build time.
 */
function shouldFailCheckout(): boolean {
  if (new URLSearchParams(window.location.search).get('fail') === '1') return true;
  return import.meta.env.VITE_MOCK_CHECKOUT_FAILS === 'true';
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { lines, subtotal, tax, serviceCharge, total, clearCart } = useCart();
  const comingSoon = useComingSoon();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (lines.length === 0) {
      navigate('/cart', { replace: true });
      return;
    }
    if (session) {
      logEvent({ eventType: 'mock_checkout_started', sessionId: session.sessionId, metadata: { total: Number(total.toFixed(2)) } });
    }
    // Only log once when the checkout screen is first reached with items in the cart.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCompleteOrder = async () => {
    // Scope 3.1: mock checkout succeeds or fails on a test flag. Nothing is ever
    // charged either way — the flag only exercises the failure path for a demo.
    if (shouldFailCheckout()) {
      setFailed(true);
      if (session) {
        logEvent({
          eventType: 'mock_checkout_started',
          sessionId: session.sessionId,
          metadata: { total: Number(total.toFixed(2)), outcome: 'mock_failure' },
        });

        // Record the declined attempt so it appears in the patron's order history
        // instead of vanishing. It never reaches the kitchen display.
        try {
          await createOrder({
            sessionId: session.sessionId,
            tableNumber: session.tableNumber,
            total,
            lines,
            status: 'declined',
          });
        } catch {
          // The on-screen decline notice is the patron's feedback; this row is a record.
        }
      }
      // The cart is intentionally kept so the patron can simply try again.
      return;
    }

    if (session) {
      logEvent({
        eventType: 'mock_checkout_completed',
        sessionId: session.sessionId,
        metadata: { total: Number(total.toFixed(2)), item_count: lines.reduce((sum, l) => sum + l.quantity, 0) },
      });

      // Record the simulated order so the kitchen display has a ticket to show. Best
      // effort — a failure here must not strand the patron on the checkout screen.
      try {
        await createOrder({
          sessionId: session.sessionId,
          tableNumber: session.tableNumber,
          total,
          lines,
        });
      } catch {
        // Swallowed deliberately: the order is a demo artefact, not the patron's receipt.
      }
    }
    clearCart();
    navigate('/order-status');
  };

  return (
    <section className="screen screen--no-nav" style={{ paddingBottom: 110 }}>
      <ScreenHeader title="Checkout" showBack />

      <div className="card card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 className="headline-md" style={{ fontSize: 20 }}>
            Order Summary
          </h2>
          <span className="label-sm">Est. Prep Time: 15–20 min</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {lines.map((line) => (
            <div key={line.menuItem.id} style={{ display: 'flex', gap: 12 }}>
              <div className="image-placeholder" style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)' }}>
                <IconFork width={16} height={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}>{line.menuItem.name}</span>
                  <span>{formatPrice(Number(line.menuItem.price) * line.quantity)}</span>
                </div>
                <span className="label-sm">{line.menuItem.description}</span>
                <p className="label-sm">Qty: {line.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Tax</span>
            <span>{formatPrice(tax)}</span>
          </div>
          <div className="summary-row">
            <span>Service Charge (18%)</span>
            <span>{formatPrice(serviceCharge)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="card card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div className="status-icon" style={{ width: 44, height: 44 }}>
          <IconCheck width={20} height={20} />
        </div>
        <div style={{ flex: 1 }}>
          <p className="label-md">Payment Authorized</p>
          <p className="label-sm">Card on file ending in 4242 (mock)</p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={comingSoon}>
          Edit
        </button>
      </div>

      {failed && (
        <div className="card card-body" role="alert" style={{ borderColor: 'var(--color-error)' }}>
          <p className="label-md" style={{ color: 'var(--color-error)' }}>
            Payment declined (mock)
          </p>
          <p className="label-sm">
            Nothing was charged. This is the simulated failure path — your cart is untouched, so you
            can try again or ask your server.
          </p>
        </div>
      )}

      <div className="sticky-footer">
        <button type="button" className="btn btn-primary" onClick={handleCompleteOrder}>
          {failed ? 'Try Again' : 'Complete Order'}
        </button>
      </div>
    </section>
  );
}
