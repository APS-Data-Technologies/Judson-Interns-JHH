import { useNavigate } from 'react-router-dom';
import { useCart } from '../../lib/cart';
import { useComingSoon } from '../../lib/toast';
import { formatPrice } from '../../lib/dietary';
import BottomNav from '../../components/BottomNav';
import ScreenHeader from '../../components/ScreenHeader';
import { EmptyState } from '../../components/AsyncState';
import { IconFork, IconMinus, IconPlus, IconTrash } from '../../components/icons';

export default function CartPage() {
  const navigate = useNavigate();
  const { lines, updateQuantity, removeItem, subtotal, tax, serviceCharge, total, loyaltyPoints } = useCart();
  const comingSoon = useComingSoon();

  return (
    <section className="screen">
      <ScreenHeader title="Your Order" />

      <div>
        <h1 className="headline-lg" style={{ fontSize: 28 }}>
          Your Order
        </h1>
        <p className="body-md">Review items and prepare for checkout.</p>
      </div>

      {lines.length === 0 ? (
        <EmptyState label="Your cart is empty. Browse the menu to add a dish." />
      ) : (
        <>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16 }}>
            <span className="body-md">Estimated Prep Time</span>
            <strong style={{ marginLeft: 'auto', fontFamily: 'var(--font-serif)' }}>15–20 min</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lines.map((line) => (
              <div key={line.menuItem.id} className="card cart-row">
                <div className="image-placeholder cart-row__image">
                  <IconFork width={20} height={20} />
                </div>
                <div className="cart-row__body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}>{line.menuItem.name}</span>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                      {formatPrice(Number(line.menuItem.price) * line.quantity)}
                    </span>
                  </div>
                  <span className="label-sm">{line.menuItem.description}</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="stepper">
                      <button type="button" onClick={() => updateQuantity(line.menuItem.id, -1)} aria-label="Decrease quantity">
                        <IconMinus width={14} height={14} />
                      </button>
                      <span>{line.quantity}</span>
                      <button type="button" onClick={() => updateQuantity(line.menuItem.id, 1)} aria-label="Increase quantity">
                        <IconPlus width={14} height={14} />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove ${line.menuItem.name}`}
                      onClick={() => removeItem(line.menuItem.id)}
                    >
                      <IconTrash width={18} height={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="label-md">Loyalty Status</p>
              <p className="label-sm">Earn {loyaltyPoints} pts with this order</p>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={comingSoon}>
              Use Points
            </button>
          </div>

          <div className="card card-body">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Taxes</span>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button type="button" className="btn btn-primary" onClick={() => navigate('/checkout')}>
              Checkout
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/menu')}>
              Continue Browsing
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </section>
  );
}
