import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import SplashPage from './SplashPage';
import { renderAtRoute } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

describe('SplashPage', () => {
  beforeEach(() => {
    vi.mocked(api.logEvent).mockResolvedValue(undefined);
    vi.mocked(api.startPatronSession).mockResolvedValue({
      session_id: 'server-issued-session',
      token: 'patron-token',
      table_number: '04',
      analytics_opt_in: false,
      venue_id: 1,
      venue_name: 'Copper Dome Concierge',
    });
  });

  it('leaves the trial consent box unticked by default', () => {
    renderAtRoute({ route: '/', routes: [{ path: '/', element: <SplashPage /> }] });

    // Consent is given, never assumed (scope, Live Trial).
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('starts an opted-out session when consent is not given', async () => {
    renderAtRoute({
      route: '/',
      routes: [
        { path: '/', element: <SplashPage /> },
        { path: '/home', element: <div>HOME STUB</div> },
      ],
    });

    fireEvent.click(screen.getByText('Start Dining'));

    await waitFor(() => expect(api.startPatronSession).toHaveBeenCalledWith('04', false));
  });

  it('passes the patron consent through when the box is ticked', async () => {
    renderAtRoute({
      route: '/',
      routes: [
        { path: '/', element: <SplashPage /> },
        { path: '/home', element: <div>HOME STUB</div> },
      ],
    });

    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByText('Start Dining'));

    await waitFor(() => expect(api.startPatronSession).toHaveBeenCalledWith('04', true));
  });

  it('renders without errors', () => {
    renderAtRoute({ route: '/', routes: [{ path: '/', element: <SplashPage /> }] });
    expect(screen.getByText('Copper Dome')).toBeInTheDocument();
    expect(screen.getByText('Start Dining')).toBeInTheDocument();
  });

  it('starts a server-issued session and navigates to /home when Start Dining is tapped', async () => {
    renderAtRoute({
      route: '/',
      routes: [
        { path: '/', element: <SplashPage /> },
        { path: '/home', element: <div>HOME STUB</div> },
      ],
    });

    fireEvent.click(screen.getByText('Start Dining'));

    // The server mints the session id and writes session_started — the client cannot
    // forge either (scope 5.6).
    await waitFor(() => expect(api.startPatronSession).toHaveBeenCalledWith('04', false));
    expect(api.logEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'session_started' })
    );
    await screen.findByText('HOME STUB');
  });

  it('starts a session and opens the concierge from the Ask AI Concierge button', async () => {
    renderAtRoute({
      route: '/',
      routes: [
        { path: '/', element: <SplashPage /> },
        { path: '/home', element: <div>HOME STUB</div> },
        { path: '/concierge', element: <div>CONCIERGE STUB</div> },
      ],
    });

    fireEvent.click(screen.getByText('Ask AI Concierge'));

    // A session must exist before the concierge screen so its events are attributed.
    expect(await screen.findByText('CONCIERGE STUB')).toBeInTheDocument();
    expect(screen.queryByText('HOME STUB')).not.toBeInTheDocument();
  });
});
