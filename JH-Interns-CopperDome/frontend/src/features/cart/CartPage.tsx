import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../lib/cart';
import { useComingSoon } from '../../lib/toast';
import { formatPrice } from '../../lib/dietary';
import { fetchMyOrders } from '../../lib/api';
import type { Order } from '../../lib/types';
import BottomNav from '../../components/BottomNav';
import ScreenHeader from '../../components/ScreenHeader';
import OrderList from '../../components/OrderList';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { IconFork, IconMinus, IconPlus, IconTrash } from '../../components/icons';

const POLL_MS = 10000;

type Tab = 'cart' | 'all';

/**
 * My Orders — the one place a patron manages what they're ordering and what they've
 * ordered.
 *
 * "Your Order" is the live cart (still editable, still un-ordered); "All Orders" is
 * everything already sent to the kitchen, including declined attempts. Reached from the
 * bag in the bottom nav, or from the ⋯ menu.
 */
export default function CartPage({ initialTab = 'cart' }: { initialTab?: Tab } = {}) {
  const navigate = useNavigate();
  const { lines, updateQuantity, removeItem, subtotal, tax, serviceCharge, total, loyaltyPoints } = useCart();
  const comingSoon = useComingSoon();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersStatus, setOrdersStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const loadOrders = useCallback(async () => {
    try {
      setOrders(await fetchMyOrders());
      setOrdersStatus('ready');
    } catch {
      // The cart half must keep working even if order history is unreachable.
      setOrdersStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, POLL_MS);
    return () => clearInterval(timer);
  }, [loadOrders]);

  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  return (
    <section className="screen">
      <ScreenHeader title="My Orders" />

      <div className="tab-row">
        <button
          type="button"
          className={`tab${tab === 'cart' ? ' is-active' : ''}`}
          onClick={() => setTab('cart')}
        >
          Your Order{cartCount > 0 ? ` (${cartCount})` : ''}
        </button>
        <button
          type="button"
          className={`tab${tab === 'all' ? ' is-active' : ''}`}
          onClick={() => setTab('all')}
        >
          All Orders{orders.length > 0 ? ` (${orders.length})` : ''}
        </button>
      </div>

      {tab === 'all' && (
        <>
          {ordersStatus === 'loading' && <LoadingState label="Loading your orders..." />}
          {ordersStatus === 'error' && <ErrorState label="Couldn't load your orders. Please try again." />}
          {ordersStatus === 'ready' && orders.length === 0 && (
            <EmptyState label="Nothing ordered yet tonight." />
          )}
          <OrderList orders={orders} />
        </>
      )}

      {tab === 'cart' && (
      <>
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
      </>
      )}

      <BottomNav />
    </section>
  );
}
