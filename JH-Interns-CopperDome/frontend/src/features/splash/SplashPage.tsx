import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../lib/session';
import { IconArrowLeft, IconSparkles } from '../../components/icons';

export default function SplashPage() {
  const navigate = useNavigate();
  const { session, startSession } = useSession();
  const [isStarting, setIsStarting] = useState(false);
  // Unticked by default — consent is given, never assumed (scope, Live Trial).
  const [optIn, setOptIn] = useState(false);

  useEffect(() => {
    if (session) {
      navigate('/home', { replace: true });
    }
    // Only re-check on mount — starting a fresh session should stay on this screen
    // until the patron explicitly taps "Start Dining".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const begin = async (destination: string) => {
    setIsStarting(true);
    try {
      await startSession(undefined, optIn);
      navigate(destination);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartDining = () => begin('/home');

  // The concierge needs a session to attribute its events to, so start one first
  // and drop the patron straight into the chat.
  const handleAskConcierge = () => begin('/concierge');

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
        <label className="consent">
          <input
            type="checkbox"
            checked={optIn}
            onChange={(event) => setOptIn(event.target.checked)}
            aria-describedby="consent-detail"
          />
          <span>
            <span className="consent__title">Help us test this</span>
            <span className="consent__detail" id="consent-detail">
              We&apos;re trialling this concierge. Share anonymous usage — which dishes you
              view and what you ask — so we can tell whether it&apos;s useful. No personal or
              payment details, and everything works exactly the same either way.
            </span>
          </span>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" className="btn btn-primary" onClick={handleStartDining} disabled={isStarting}>
            {isStarting ? 'Starting...' : 'Start Dining'}
            <IconArrowLeft style={{ transform: 'rotate(180deg)' }} width={18} height={18} />
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleAskConcierge} disabled={isStarting}>
            <IconSparkles width={18} height={18} />
            Ask AI Concierge
          </button>
        </div>
      </div>
    </section>
  );
}
