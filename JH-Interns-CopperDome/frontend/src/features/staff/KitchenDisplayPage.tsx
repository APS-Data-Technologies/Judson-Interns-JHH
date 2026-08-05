import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { advanceOrder, fetchKitchenDisplay } from '../../lib/api';
import type { KitchenStation, OrderStatus } from '../../lib/types';
import { EmptyState, ErrorState, LoadingState } from '../../components/AsyncState';
import { IconCheck, IconClock } from '../../components/icons';

const REFRESH_MS = 5000;

const NEXT_ACTION: Record<OrderStatus, string | null> = {
  placed: 'Start',
  preparing: 'Ready',
  ready: 'Served',
  served: null,
  // Declined orders never reach the board — the backend filters them out.
  declined: null,
};

function elapsed(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h`;
}

/**
 * Mock kitchen display. Scope 4 puts the live Toast/Incentivio integration out of phase 1
 * and has a mock KDS stand in for it — one column per kitchen, each seeing only the lines
 * it has to cook, which is how a single patron order splits across the three kitchens.
 */
export default function KitchenDisplayPage() {
  const [stations, setStations] = useState<KitchenStation[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    try {
      setStations(await fetchKitchenDisplay());
      setStatus('ready');
    } catch {
      setStatus((current) => (current === 'ready' ? current : 'error'));
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Keep the "4m" ticket ages moving without re-fetching.
  useEffect(() => {
    const timer = setInterval(() => tick((n) => n + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const handleAdvance = async (orderId: number) => {
    try {
      await advanceOrder(orderId);
    } finally {
      load();
    }
  };

  const totalTickets = stations.reduce((sum, station) => sum + station.tickets.length, 0);

  return (
    <section className="screen screen--staff">
      <header className="staff-header">
        <div>
          <h1 className="headline-md">Kitchen Display</h1>
          <p className="label-sm">
            {totalTickets} open {totalTickets === 1 ? 'ticket' : 'tickets'} · mock KDS, nothing is charged
          </p>
        </div>
        <Link className="btn btn-secondary btn-sm" to="/staff">
          Floor view
        </Link>
      </header>

      {status === 'loading' && <LoadingState label="Loading tickets..." />}
      {status === 'error' && <ErrorState label="Couldn't reach the kitchen display." />}
      {status === 'ready' && totalTickets === 0 && <EmptyState label="No open tickets. All caught up." />}

      <div className="kds-grid">
        {stations.map((station) => (
          <section key={station.kitchen_id} className="kds-station">
            <header className="kds-station__head">
              <h2>{station.kitchen_name}</h2>
              <span className="chip">{station.tickets.length}</span>
            </header>

            {station.tickets.length === 0 ? (
              <p className="label-sm">Clear</p>
            ) : (
              station.tickets.map((ticket) => (
                <article key={`${ticket.order_id}-${station.kitchen_id}`} className={`kds-ticket kds-ticket--${ticket.status}`}>
                  <div className="kds-ticket__top">
                    <strong>Table {ticket.table_number}</strong>
                    <span className="label-sm">
                      <IconClock width={12} height={12} /> {elapsed(ticket.placed_at)}
                    </span>
                  </div>
                  <ul className="kds-ticket__lines">
                    {ticket.lines.map((line, index) => (
                      <li key={index}>
                        <span className="kds-ticket__qty">{line.quantity}×</span> {line.name}
                      </li>
                    ))}
                  </ul>
                  <div className="kds-ticket__foot">
                    <span className="chip">{ticket.status}</span>
                    {NEXT_ACTION[ticket.status] && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleAdvance(ticket.order_id)}
                      >
                        <IconCheck width={14} height={14} />
                        {NEXT_ACTION[ticket.status]}
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
