import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchServiceRequests, updateServiceRequestStatus } from '../../lib/api';
import { useStaffFeed } from '../../lib/staffSocket';
import type { ServiceRequest, ServiceRequestStatus } from '../../lib/types';
import { LoadingState } from '../../components/AsyncState';
import TableStatusStrip from './TableStatusStrip';
import { IconBell, IconCheck, IconClock, IconDroplet, IconReceipt, IconSparkles } from '../../components/icons';

const REQUEST_LABELS: Record<ServiceRequest['request_type'], string> = {
  call_server: 'Call Server',
  water: 'Water',
  check: 'Check',
  surprise_me: 'Surprise Me',
};

const REQUEST_ICONS: Record<ServiceRequest['request_type'], typeof IconBell> = {
  call_server: IconBell,
  water: IconDroplet,
  check: IconReceipt,
  surprise_me: IconSparkles,
};

const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  pending: 'Pending',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
};

function formatElapsed(createdAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function StaffFeedPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, forceTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchServiceRequests()
      .then((data) => {
        if (!cancelled) setRequests(data);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const { connected } = useStaffFeed(
    (message) => {
      setRequests((prev) => {
        const exists = prev.some((r) => r.id === message.request.id);
        if (exists) {
          return prev.map((r) => (r.id === message.request.id ? message.request : r));
        }
        return [message.request, ...prev];
      });
    },
    // Polling fallback: while the socket is down, re-read the list so the floor
    // still sees new requests.
    () => {
      fetchServiceRequests()
        .then(setRequests)
        .catch(() => {
          // Keep showing the last known list rather than blanking the floor view.
        });
    },
  );

  const handleAdvance = async (request: ServiceRequest) => {
    const nextStatus: ServiceRequestStatus = request.status === 'pending' ? 'acknowledged' : 'resolved';
    const updated = await updateServiceRequestStatus(request.id, nextStatus);
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const activeRequests = requests.filter((r) => r.status !== 'resolved');
  const resolvedRequests = requests.filter((r) => r.status === 'resolved');

  return (
    <section className="screen" style={{ paddingBottom: 24 }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 className="headline-md">Staff Floor View</h1>
          <p className="label-sm" style={{ marginTop: 4 }}>
            {connected ? 'Live' : 'Reconnecting — polling every 5s'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/staff/kitchen" className="chip" style={{ textDecoration: 'none' }}>
            Kitchen
          </Link>
          <Link to="/staff/analytics" className="chip" style={{ textDecoration: 'none' }}>
            Analytics
          </Link>
        </div>
      </header>

      <TableStatusStrip />

      {isLoading && <LoadingState label="Loading service requests..." />}

      {!isLoading && activeRequests.length === 0 && (
        <p className="state-message">No open requests right now.</p>
      )}

      <div className="request-list">
        {activeRequests.map((request) => {
          const Icon = REQUEST_ICONS[request.request_type];
          return (
            <div key={request.id} className="card card-body" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div className="icon-button" style={{ background: 'var(--color-surface-container-high)', flex: '0 0 auto' }}>
                <Icon width={18} height={18} color="var(--color-primary-container)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span className="label-md">{REQUEST_LABELS[request.request_type]}</span>
                  <span className={`chip${request.status === 'acknowledged' ? ' is-active' : ''}`}>
                    {STATUS_LABELS[request.status]}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 4, color: 'var(--color-on-surface-variant)' }}>
                  <span className="body-md">Table {request.table_number}</span>
                  <span className="label-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IconClock width={12} height={12} />
                    {formatElapsed(request.created_at)}
                  </span>
                </div>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleAdvance(request)}>
                <IconCheck width={16} height={16} />
                {request.status === 'pending' ? 'Acknowledge' : 'Resolve'}
              </button>
            </div>
          );
        })}
      </div>

      {resolvedRequests.length > 0 && (
        <details>
          <summary className="label-sm" style={{ cursor: 'pointer' }}>
            {resolvedRequests.length} resolved
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {resolvedRequests.map((request) => (
              <div key={request.id} className="body-md" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {REQUEST_LABELS[request.request_type]} · Table {request.table_number}
                </span>
                <span className="label-sm">{formatElapsed(request.created_at)}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
