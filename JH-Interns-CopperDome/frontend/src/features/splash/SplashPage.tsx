import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/session';
import { useComingSoon } from '../../lib/toast';
import { IconArrowLeft, IconSparkles } from '../../components/icons';

export default function SplashPage() {
  const navigate = useNavigate();
  const { session, startSession } = useSession();
  const comingSoon = useComingSoon();
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (session) {
      navigate('/home', { replace: true });
    }
    // Only re-check on mount — starting a fresh session should stay on this screen
    // until the patron explicitly taps "Start Dining".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartDining = async () => {
    setIsStarting(true);
    try {
      await startSession();
      navigate('/home');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <section className="screen screen--center screen--no-nav">
      <div className="glass-panel card-body" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <p className="label-md" style={{ color: 'var(--color-primary-container)' }}>
            Welcome to
          </p>
          <h1 className="headline-lg" style={{ marginTop: 8 }}>
            Copper Dome
          </h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" className="btn btn-primary" onClick={handleStartDining} disabled={isStarting}>
            {isStarting ? 'Starting...' : 'Start Dining'}
            <IconArrowLeft style={{ transform: 'rotate(180deg)' }} width={18} height={18} />
          </button>
          <button type="button" className="btn btn-secondary" onClick={comingSoon}>
            <IconSparkles width={18} height={18} />
            Ask AI Concierge
          </button>
        </div>
      </div>
    </section>
  );
}
