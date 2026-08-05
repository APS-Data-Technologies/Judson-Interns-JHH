import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconBook, IconBot, IconBag, IconMore, IconReceipt, IconClock, IconBell } from './icons';
import { useCart } from '../lib/cart';
import { useToast } from '../lib/toast';
import { createServiceRequest } from '../lib/api';
import { useSession } from '../lib/session';

const ITEMS = [
  { key: 'home', path: '/home', Icon: IconHome },
  { key: 'menu', path: '/menu', Icon: IconBook },
  { key: 'concierge', path: '/concierge', Icon: IconBot },
  { key: 'cart', path: '/cart', Icon: IconBag },
  // Opens the More sheet instead of navigating.
  { key: 'more', path: null, Icon: IconMore },
] as const;

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();
  const { session } = useSession();
  const { showToast } = useToast();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Close the sheet on Escape, the same way a tap outside it does.
  useEffect(() => {
    if (!isMoreOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMoreOpen]);

  const go = (path: string) => {
    setIsMoreOpen(false);
    navigate(path);
  };

  const callServer = async () => {
    setIsMoreOpen(false);
    if (!session) return;
    try {
      await createServiceRequest(session.sessionId, session.tableNumber, 'call_server');
      showToast('A server has been notified');
    } catch {
      showToast("Couldn't send that request — please flag down your server.");
    }
  };

  return (
    <>
      <nav className="bottom-nav" aria-label="Primary">
        {ITEMS.map(({ key, path, Icon }) => {
          const isActive =
            (path !== null && location.pathname === path) ||
            (path === '/menu' && location.pathname.startsWith('/menu/')) ||
            (key === 'more' && isMoreOpen);

          return (
            <button
              key={key}
              type="button"
              className={`bottom-nav__item${isActive ? ' is-active' : ''}`}
              onClick={() => (path === null ? setIsMoreOpen((open) => !open) : navigate(path))}
              aria-label={key === 'more' ? 'More options' : key}
              aria-current={isActive && path !== null ? 'page' : undefined}
              aria-expanded={key === 'more' ? isMoreOpen : undefined}
              style={{ position: 'relative' }}
            >
              <Icon />
              {key === 'cart' && itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 4,
                    background: 'var(--color-primary)',
                    color: 'var(--color-on-primary)',
                    borderRadius: '9999px',
                    fontSize: 10,
                    fontWeight: 700,
                    minWidth: 16,
                    height: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                  }}
                >
                  {itemCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {isMoreOpen && (
        <>
          <div className="sheet-backdrop" onClick={() => setIsMoreOpen(false)} aria-hidden="true" />
          <div className="sheet" role="dialog" aria-label="More options">
            <div className="sheet__handle" aria-hidden="true" />

            <button type="button" className="sheet__item" onClick={() => go('/orders')}>
              <IconReceipt width={20} height={20} />
              <span>
                <span className="sheet__label">My Orders</span>
                <span className="sheet__detail">Everything you&apos;ve ordered tonight</span>
              </span>
            </button>

            <button type="button" className="sheet__item" onClick={() => go('/order-status')}>
              <IconClock width={20} height={20} />
              <span>
                <span className="sheet__label">Current order status</span>
                <span className="sheet__detail">Follow it until it reaches the table</span>
              </span>
            </button>

            <button type="button" className="sheet__item" onClick={callServer}>
              <IconBell width={20} height={20} />
              <span>
                <span className="sheet__label">Call a server</span>
                <span className="sheet__detail">Someone will come over to your table</span>
              </span>
            </button>

            <button type="button" className="btn btn-secondary" onClick={() => setIsMoreOpen(false)}>
              Close
            </button>
          </div>
        </>
      )}
    </>
  );
}
