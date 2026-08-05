import { useState } from 'react';
import { useSession } from '../lib/session';
import { useToast } from '../lib/toast';

/**
 * Makes the recording state visible, and reversible.
 *
 * A session that declined the trial records nothing — without this, that is silent, and
 * both patrons and anyone demoing the app are left wondering why the analytics never
 * move. Consent that can't be withdrawn isn't consent either, so this works both ways.
 */
export default function ConsentBanner() {
  const { session, updateConsent } = useSession();
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  if (!session) return null;

  const optedIn = session.analyticsOptIn;

  const toggle = async () => {
    setIsSaving(true);
    try {
      await updateConsent(!optedIn);
      showToast(
        optedIn
          ? 'Sharing turned off — this session’s data has been deleted'
          : 'Thanks — this session is now helping the trial'
      );
    } catch {
      showToast("Couldn't update that. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`consent-banner${optedIn ? ' is-on' : ''}`}>
      <span className="consent-banner__dot" aria-hidden="true" />
      <span className="consent-banner__text">
        {optedIn ? 'Helping us test this concierge' : 'Not sharing usage — nothing is recorded'}
      </span>
      <button type="button" className="btn btn-ghost btn-sm" onClick={toggle} disabled={isSaving}>
        {optedIn ? 'Stop' : 'Help out'}
      </button>
    </div>
  );
}
