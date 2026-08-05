import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createServiceRequest, fetchKitchens, fetchMenuItems } from '../../lib/api';
import { useSession } from '../../lib/session';
import { useToast } from '../../lib/toast';
import { formatPrice } from '../../lib/dietary';
import type { Kitchen, MenuItem, ServiceRequestType } from '../../lib/types';
import BottomNav from '../../components/BottomNav';
import ConsentBanner from '../../components/ConsentBanner';
import { LoadingState } from '../../components/AsyncState';
import {
  IconBook,
  IconBot,
  IconDroplet,
  IconBell,
  IconReceipt,
  IconSparkles,
  IconFork,
} from '../../components/icons';

interface Highlight {
  item: MenuItem;
  kitchenName: string;
}

type TileAction =
  | { type: 'navigate'; to: string }
  | { type: 'service_request'; requestType: ServiceRequestType; confirmation: string };

const ACTION_TILES: Array<{ key: string; label: string; Icon: typeof IconBook; action: TileAction }> = [
  { key: 'browse', label: 'Browse Menu', Icon: IconBook, action: { type: 'navigate', to: '/menu' } },
  { key: 'concierge', label: 'Ask AI Concierge', Icon: IconBot, action: { type: 'navigate', to: '/concierge' } },
  {
    key: 'water',
    label: 'Need Water',
    Icon: IconDroplet,
    action: { type: 'service_request', requestType: 'water', confirmation: 'Water is on its way' },
  },
  {
    key: 'server',
    label: 'Call Server',
    Icon: IconBell,
    action: { type: 'service_request', requestType: 'call_server', confirmation: 'A server has been notified' },
  },
  {
    key: 'check',
    label: 'Request Check',
    Icon: IconReceipt,
    action: { type: 'service_request', requestType: 'check', confirmation: 'Your check is on the way' },
  },
  {
    key: 'surprise',
    label: 'Surprise Me',
    Icon: IconSparkles,
    action: { type: 'service_request', requestType: 'surprise_me', confirmation: "The kitchen's on it" },
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const { showToast } = useToast();
  const [chefSelection, setChefSelection] = useState<Highlight | null>(null);
  const [curatedForYou, setCuratedForYou] = useState<Highlight | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHighlights() {
      try {
        const kitchens = await fetchKitchens();
        const highlights: Highlight[] = [];
        for (const kitchen of kitchens as Kitchen[]) {
          const items = await fetchMenuItems(kitchen.id);
          items.forEach((item) => highlights.push({ item, kitchenName: kitchen.name }));
          if (highlights.length >= 2) break;
        }
        if (!cancelled) {
          setChefSelection(highlights[0] ?? null);
          setCuratedForYou(highlights[1] ?? null);
        }
      } catch {
        // Highlights are a nice-to-have on this screen — leave them blank on failure.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadHighlights();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleTileAction = async (action: TileAction) => {
    if (action.type === 'navigate') {
      navigate(action.to);
      return;
    }
    if (!session) return;
    try {
      await createServiceRequest(session.sessionId, session.tableNumber, action.requestType);
      showToast(action.confirmation);
    } catch {
      showToast("Couldn't send that request — please flag down your server.");
    }
  };

  return (
    <section className="screen">
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="headline-md">{session?.venueName || 'Copper Dome'}</h1>
        </div>
        {session && <span className="chip">Table {session.tableNumber}</span>}
      </header>

      <ConsentBanner />

      {isLoading && <LoadingState label="Loading tonight's menu..." />}

      {chefSelection && (
        <div
          className="card"
          role="button"
          tabIndex={0}
          onClick={() => navigate(`/menu/${chefSelection.item.id}`)}
        >
          <div className="image-placeholder" style={{ aspectRatio: '16/9' }}>
            <IconFork width={40} height={40} />
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="chip">Chef's Selection</span>
            <h2 className="headline-md">{chefSelection.item.name}</h2>
          </div>
        </div>
      )}

      <div className="tile-grid">
        {ACTION_TILES.map(({ key, label, Icon, action }) => (
          <button
            key={key}
            type="button"
            className="action-tile"
            onClick={() => handleTileAction(action)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {curatedForYou && (
        <div>
          <h2 className="headline-md" style={{ marginBottom: 12 }}>
            Curated for You
          </h2>
          <div
            className="card"
            role="button"
            tabIndex={0}
            onClick={() => navigate(`/menu/${curatedForYou.item.id}`)}
          >
            <div className="image-placeholder" style={{ aspectRatio: '16/9' }}>
              <IconFork width={40} height={40} />
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18 }}>{curatedForYou.item.name}</h3>
              <p className="body-md">{curatedForYou.item.description}</p>
              <span className="label-sm">{formatPrice(curatedForYou.item.price)}</span>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </section>
  );
}
