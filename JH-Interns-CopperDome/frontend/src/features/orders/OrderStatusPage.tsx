import { useNavigate } from 'react-router-dom';
import { useComingSoon } from '../../lib/toast';
import ScreenHeader from '../../components/ScreenHeader';
import { IconBell, IconBot, IconCheck, IconClock } from '../../components/icons';

const ESTIMATED_PREP_MINUTES = 18;
const PROGRESS_PERCENT = 15;

export default function OrderStatusPage() {
  const navigate = useNavigate();
  const comingSoon = useComingSoon();

  return (
    <section className="screen screen--center screen--no-nav">
      <ScreenHeader title="Order Status" />

      <div className="status-icon" style={{ width: 96, height: 96 }}>
        <IconCheck width={40} height={40} />
      </div>

      <div>
        <h1 className="headline-lg" style={{ fontSize: 26 }}>
          Your order is being prepared
        </h1>
        <p className="body-md" style={{ marginTop: 12 }}>
          The kitchen has received your request. Relax and enjoy the atmosphere.
        </p>
      </div>

      <div className="card card-body" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p className="label-sm">Est. Preparation</p>
            <p className="headline-md" style={{ color: 'var(--color-primary)' }}>
              {ESTIMATED_PREP_MINUTES} mins
            </p>
          </div>
          <div className="icon-button" style={{ background: 'var(--color-surface-container-high)' }}>
            <IconClock width={18} height={18} />
          </div>
        </div>
        <div className="progress-bar">
          <div className="progress-bar__fill" style={{ width: `${PROGRESS_PERCENT}%` }} />
        </div>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/home')}>
          Continue Browsing
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={comingSoon}>
            <IconBot width={18} height={18} />
            Ask Concierge
          </button>
          <button type="button" className="btn btn-secondary" onClick={comingSoon}>
            <IconBell width={18} height={18} />
            Request Service
          </button>
        </div>
      </div>
    </section>
  );
}
