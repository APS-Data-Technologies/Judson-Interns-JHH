import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchKitchens, fetchMenuItem, logEvent } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useCart } from '../../lib/cart';
import { useToast } from '../../lib/toast';
import { dietaryLabel, formatPrice } from '../../lib/dietary';
import type { Kitchen, MenuItem } from '../../lib/types';
import ScreenHeader from '../../components/ScreenHeader';
import { LoadingState, ErrorState } from '../../components/AsyncState';
import { IconFork, IconHeart, IconSparkles } from '../../components/icons';

export default function DishDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [item, setItem] = useState<MenuItem | null>(null);
  const [kitchen, setKitchen] = useState<Kitchen | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [isFavorited, setIsFavorited] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setStatus('loading');

    Promise.all([fetchMenuItem(Number(id)), fetchKitchens()])
      .then(([menuItem, kitchens]) => {
        if (cancelled) return;
        setItem(menuItem);
        setKitchen(kitchens.find((k) => k.id === menuItem.kitchen) ?? null);
        setStatus('ready');
        if (session) {
          logEvent({
            eventType: 'menu_item_viewed',
            sessionId: session.sessionId,
            metadata: { menu_item_id: menuItem.id },
          });
        }
      })
      .catch(() => !cancelled && setStatus('error'));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const keyElements = useMemo(
    () => (item ? item.description.split(',').map((part) => part.trim()).filter(Boolean) : []),
    [item]
  );

  const handleAddToCart = () => {
    if (!item || !kitchen) return;
    addItem(item, kitchen.name);
    setJustAdded(true);
    showToast(`Added ${item.name} to cart`);
    if (session) {
      logEvent({
        eventType: 'item_added_to_cart',
        sessionId: session.sessionId,
        metadata: { menu_item_id: item.id, quantity: 1, source: 'dish_details' },
      });
    }
    setTimeout(() => setJustAdded(false), 1800);
  };

  return (
    <section className="screen screen--no-nav" style={{ paddingBottom: 110 }}>
      <ScreenHeader
        title="Dish Details"
        showBack
        rightSlot={
          <button
            type="button"
            className="icon-button"
            aria-label="Favorite"
            aria-pressed={isFavorited}
            onClick={() => setIsFavorited((prev) => !prev)}
          >
            <IconHeart fill={isFavorited ? 'currentColor' : 'none'} color={isFavorited ? 'var(--color-primary)' : undefined} />
          </button>
        }
      />

      {status === 'loading' && <LoadingState label="Loading dish details..." />}
      {status === 'error' && <ErrorState label="Couldn't load this dish. Please go back and try again." />}

      {status === 'ready' && item && (
        <>
          <div className="image-placeholder" style={{ borderRadius: 'var(--radius-xl)', aspectRatio: '4/3' }}>
            <IconFork width={48} height={48} />
          </div>

          <div>
            <p className="label-sm">{item.category}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <h1 className="headline-md">{item.name}</h1>
              <span className="headline-md" style={{ color: 'var(--color-primary)' }}>
                {formatPrice(item.price)}
              </span>
            </div>
          </div>

          <p className="body-md">{item.description}</p>

          {item.dietary_tags.length > 0 && (
            <div className="chip-row">
              {item.dietary_tags.map((tag) => (
                <span key={tag} className="chip">
                  {dietaryLabel(tag)}
                </span>
              ))}
            </div>
          )}

          {keyElements.length > 0 && (
            <div>
              <h2 className="headline-md" style={{ fontSize: 20, marginBottom: 12 }}>
                Key Elements
              </h2>
              <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {keyElements.map((element) => (
                  <li key={element} className="body-md">
                    {element}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card card-body" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <IconSparkles color="var(--color-primary-container)" />
            <div>
              <p className="label-md" style={{ color: 'var(--color-primary-container)' }}>
                Sommelier Match
              </p>
              <p className="body-md" style={{ marginTop: 4 }}>
                AI-curated pairings arrive in a later release. Ask your server for tonight's recommendation.
              </p>
            </div>
          </div>
        </>
      )}

      {status === 'ready' && item && (
        <div className="sticky-footer">
          <button type="button" className="btn btn-primary" onClick={handleAddToCart}>
            {justAdded ? 'Added to Cart' : `Add to Cart · ${formatPrice(item.price)}`}
          </button>
        </div>
      )}
    </section>
  );
}
