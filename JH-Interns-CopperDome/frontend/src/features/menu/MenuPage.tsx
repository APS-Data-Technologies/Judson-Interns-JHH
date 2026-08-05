import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchKitchens, fetchMenuItems, logEvent } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useCart } from '../../lib/cart';
import { useToast } from '../../lib/toast';
import { dietaryLabel } from '../../lib/dietary';
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
  // Dietary tags were printed but not actionable — a patron with a restriction had to read
  // all 35 dishes or ask the concierge. Selecting several narrows to dishes carrying all
  // of them, which is what "vegetarian AND gluten-free" means to the person asking.
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

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
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, []);

  // `null` means All Kitchens — the unified browse the scope calls for (3.1). Fetching
  // without a kitchen filter returns every dish across the three kitchens in one list.
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSelectedCategory('All');
    setVisibleCount(PAGE_SIZE);
    fetchMenuItems(selectedKitchenId ?? undefined)
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

  // Tags actually present in the current list, so the row never offers a filter that
  // would return nothing.
  const availableTags = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((item) => item.dietary_tags.forEach((tag) => unique.add(tag)));
    return Array.from(unique).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      const matchesTags = selectedTags.every((tag) => item.dietary_tags.includes(tag));
      return matchesCategory && matchesSearch && matchesTags;
    });
  }, [items, selectedCategory, search, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    );
    setVisibleCount(PAGE_SIZE);
  };

  const visibleItems = filteredItems.slice(0, visibleCount);

  // In the unified view every dish can come from a different kitchen, so resolve the
  // name per item rather than from a single selected kitchen.
  const kitchenNameFor = (item: MenuItem) =>
    kitchens.find((kitchen) => kitchen.id === item.kitchen)?.name ?? '';

  const handleQuickAdd = (item: MenuItem) => {
    addItem(item, kitchenNameFor(item));
    showToast(`Added ${item.name} to cart`);
    if (session) {
      logEvent({
        eventType: 'item_added_to_cart',
        sessionId: session.sessionId,
        metadata: {
          menu_item_id: item.id,
          quantity: 1,
          source: 'menu_list',
          kitchen_id: item.kitchen,
          // Distinguishes cross-kitchen discovery from single-kitchen browsing.
          view: selectedKitchenId === null ? 'all_kitchens' : 'single_kitchen',
        },
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
          <button
            type="button"
            className={`pill${selectedKitchenId === null ? ' is-active' : ''}`}
            onClick={() => setSelectedKitchenId(null)}
          >
            All Kitchens
          </button>
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

      {availableTags.length > 0 && (
        <div className="diet-row">
          <p className="label-sm">Dietary</p>
          <div className="diet-row__chips">
            {availableTags.map((tag) => {
              const isOn = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`diet-chip${isOn ? ' is-active' : ''}`}
                  aria-pressed={isOn}
                  onClick={() => toggleTag(tag)}
                >
                  <span className="diet-chip__tag">{tag}</span>
                  {dietaryLabel(tag)}
                </button>
              );
            })}
            {selectedTags.length > 0 && (
              <button type="button" className="diet-chip diet-chip--clear" onClick={() => setSelectedTags([])}>
                Clear
              </button>
            )}
          </div>
        </div>
      )}

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
      {status === 'ready' && filteredItems.length === 0 && (
        <EmptyState
          label={
            selectedTags.length > 0
              ? `No dishes here are ${selectedTags.map(dietaryLabel).join(' and ').toLowerCase()}. Try another kitchen, or ask the concierge.`
              : 'No dishes match your search.'
          }
        />
      )}

      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleItems.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              kitchenName={kitchenNameFor(item)}
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
