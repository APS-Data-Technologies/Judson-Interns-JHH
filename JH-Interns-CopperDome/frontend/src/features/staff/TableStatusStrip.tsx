import { useEffect, useState } from 'react';
import { fetchTableStates } from '../../lib/api';
import type { TableState, TableStatus } from '../../lib/types';

const REFRESH_MS = 10000;

const STATUS_LABELS: Record<TableStatus, string> = {
  needs_attention: 'Needs attention',
  order_open: 'Order in progress',
  seated: 'Seated',
  free: 'Free',
};

/**
 * The "and table status" half of scope 3.4. There is no table registry in phase 1, so a
 * table's state is derived from its open requests, open orders, and recent session events.
 */
export default function TableStatusStrip() {
  const [tables, setTables] = useState<TableState[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetchTableStates()
        .then((data) => {
          if (!cancelled) setTables(data);
        })
        .catch(() => {
          // The request feed below is the primary surface — leave the last known state up.
        });
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (tables.length === 0) return null;

  const counts = tables.reduce<Record<string, number>>((acc, table) => {
    acc[table.status] = (acc[table.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="table-status" aria-label="Table status">
      <div className="table-status__head">
        <p className="label-sm">Tables</p>
        <p className="label-sm">
          {counts.needs_attention ?? 0} need attention · {counts.order_open ?? 0} cooking ·{' '}
          {counts.seated ?? 0} seated
        </p>
      </div>
      <div className="table-status__grid">
        {tables.map((table) => (
          <div
            key={table.table_number}
            className={`table-chip table-chip--${table.status}`}
            title={`Table ${table.table_number} — ${STATUS_LABELS[table.status]}`}
          >
            <span className="table-chip__number">{table.table_number}</span>
            {table.open_requests > 0 && <span className="table-chip__badge">{table.open_requests}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
