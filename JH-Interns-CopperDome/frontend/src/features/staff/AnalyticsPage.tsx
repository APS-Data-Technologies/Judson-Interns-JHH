import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAnalytics } from '../../lib/api';
import type { AnalyticsSummary } from '../../lib/types';
import { LoadingState, ErrorState } from '../../components/AsyncState';

const REQUEST_TYPE_LABELS: Record<string, string> = {
  call_server: 'Call Server',
  water: 'Water',
  check: 'Check',
  surprise_me: 'Surprise Me',
};

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card card-body">
      <p className="label-sm">{label}</p>
      <p className="headline-md" style={{ color: 'var(--color-primary)', marginTop: 6 }}>
        {value}
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics()
      .then((data) => {
        if (!cancelled) {
          setSummary(data);
          setStatus('ready');
        }
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="screen" style={{ paddingBottom: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 className="headline-md">Trial Analytics</h1>
        <Link to="/staff" className="chip" style={{ textDecoration: 'none' }}>
          Floor View
        </Link>
      </header>

      {status === 'loading' && <LoadingState label="Loading analytics..." />}
      {status === 'error' && <ErrorState label="Couldn't load analytics. Pull to refresh and try again." />}

      {status === 'ready' && summary && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <StatTile label="Total Sessions" value={String(summary.total_sessions)} />
            <StatTile label="Concierge-Open Rate" value={formatPercent(summary.concierge_open_rate)} />
            <StatTile label="AI Queries / Session" value={summary.ai_queries_per_session.toFixed(1)} />
            <StatTile label="Menu-to-Cart Drop-off" value={formatPercent(summary.menu_to_cart_drop_off)} />
            <StatTile
              label="Median Session Duration"
              value={formatDuration(summary.median_session_duration_seconds)}
            />
          </div>

          <div className="card card-body">
            <p className="label-sm" style={{ marginBottom: 12 }}>
              Request Types by Frequency
            </p>
            {Object.keys(summary.request_types_by_frequency).length === 0 && (
              <p className="body-md">No service requests logged yet.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(summary.request_types_by_frequency).map(([type, count]) => (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="body-md">{REQUEST_TYPE_LABELS[type] ?? type}</span>
                  <span className="label-md">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
