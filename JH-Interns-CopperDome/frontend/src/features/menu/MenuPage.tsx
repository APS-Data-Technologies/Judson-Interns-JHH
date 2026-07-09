import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchKitchens, fetchMenuItems, logEvent } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useCart } from '../../lib/cart';
import { useToast } from '../../lib/toast';
import type { Kitchen, MenuItem } from '../../lib/types';
import BottomNav from '../../components/BottomNav';
import ScreenHeader from '../../components/ScreenHeader';
import MenuItemCard from '../../components/MenuItemCard';
import { LoadingState, ErrorState, EmptyState } from '../../components/AsyncState';
import { IconSearch } from '../../components/icons';

const PAGE_SIZE = 6;

export default function MenuPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [selectedKitchenId, setSelectedKitchenId] = useState<number | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (session) {
      logEvent({ eventType: 'menu_viewed', sessionId: session.sessionId });
    }
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    fetchKitchens()
      .then((data) => {
        if (cancelled) return;
        setKitchens(data);
        if (data[0]) setSelectedKitchenId(data[0].id);
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedKitchenId === null) return;
    let cancelled = false;
    setStatus('loading');
    setSelectedCategory('All');
    setVisibleCount(PAGE_SIZE);
    fetchMenuItems(selectedKitchenId)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [selectedKitchenId]);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category)));
    return ['All', ...unique];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, search]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const selectedKitchen = kitchens.find((kitchen) => kitchen.id === selectedKitchenId);

  const handleQuickAdd = (item: MenuItem) => {
    if (!selectedKitchen) return;
    addItem(item, selectedKitchen.name);
    showToast(`Added ${item.name} to cart`);
    if (session) {
      logEvent({
        eventType: 'item_added_to_cart',
        sessionId: session.sessionId,
        metadata: { menu_item_id: item.id, quantity: 1, source: 'menu_list' },
      });
    }
  };

  return (
    <section className="screen">
      <ScreenHeader title="Menu" />

      <div className="search-field">
        <IconSearch />
        <input
          className="input"
          placeholder="Search the menu..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div>
        <p className="label-sm" style={{ marginBottom: 8 }}>
          Kitchens
        </p>
        <div className="pill-row">
          {kitchens.map((kitchen) => (
            <button
              key={kitchen.id}
              type="button"
              className={`pill${kitchen.id === selectedKitchenId ? ' is-active' : ''}`}
              onClick={() => setSelectedKitchenId(kitchen.id)}
            >
              {kitchen.name}
            </button>
          ))}
        </div>
      </div>

      <div className="tab-row">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`tab${category === selectedCategory ? ' is-active' : ''}`}
            onClick={() => {
              setSelectedCategory(category);
              setVisibleCount(PAGE_SIZE);
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {status === 'loading' && <LoadingState label="Loading menu items..." />}
      {status === 'error' && <ErrorState label="Couldn't load the menu. Pull to refresh and try again." />}
      {status === 'ready' && filteredItems.length === 0 && <EmptyState label="No dishes match your search." />}

      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              kitchenName={selectedKitchen?.name ?? ''}
              onOpen={() => navigate(`/menu/${item.id}`)}
              onQuickAdd={() => handleQuickAdd(item)}
            />
          ))}
          {visibleCount < filteredItems.length && (
            <button type="button" className="btn btn-secondary" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
              Load More
            </button>
          )}
        </div>
      )}

      <BottomNav />
    </section>
  );
}
