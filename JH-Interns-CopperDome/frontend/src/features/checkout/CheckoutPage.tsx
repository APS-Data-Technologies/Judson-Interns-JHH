import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logEvent } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useCart } from '../../lib/cart';
import { useComingSoon } from '../../lib/toast';
import { formatPrice } from '../../lib/dietary';
import ScreenHeader from '../../components/ScreenHeader';
import { IconCheck, IconFork } from '../../components/icons';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { lines, subtotal, tax, serviceCharge, total, clearCart } = useCart();
  const comingSoon = useComingSoon();

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

  const handleCompleteOrder = () => {
    if (session) {
      logEvent({
        eventType: 'mock_checkout_completed',
        sessionId: session.sessionId,
        metadata: { total: Number(total.toFixed(2)), item_count: lines.reduce((sum, l) => sum + l.quantity, 0) },
      });
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

      <div className="sticky-footer">
        <button type="button" className="btn btn-primary" onClick={handleCompleteOrder}>
          Complete Order
        </button>
      </div>
    </section>
  );
}
