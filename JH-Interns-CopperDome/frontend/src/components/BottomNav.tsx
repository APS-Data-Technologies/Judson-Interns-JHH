import { useNavigate, useLocation } from 'react-router-dom';
import { IconHome, IconBook, IconBot, IconBag, IconMore } from './icons';
import { useCart } from '../lib/cart';
import { useComingSoon } from '../lib/toast';

const ITEMS = [
  { key: 'home', path: '/home', Icon: IconHome, enabled: true },
  { key: 'menu', path: '/menu', Icon: IconBook, enabled: true },
  { key: 'concierge', path: '/concierge', Icon: IconBot, enabled: false },
  { key: 'cart', path: '/cart', Icon: IconBag, enabled: true },
  { key: 'more', path: '/more', Icon: IconMore, enabled: false },
] as const;

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();
  const comingSoon = useComingSoon();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map(({ key, path, Icon, enabled }) => {
        const isActive = location.pathname === path || (path === '/menu' && location.pathname.startsWith('/menu/'));
        return (
          <button
            key={key}
            type="button"
            className={`bottom-nav__item${isActive ? ' is-active' : ''}`}
            onClick={() => (enabled ? navigate(path) : comingSoon())}
            aria-label={key}
            aria-current={isActive ? 'page' : undefined}
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
  );
}
