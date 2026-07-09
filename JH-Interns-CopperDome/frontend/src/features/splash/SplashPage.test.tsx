import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import SplashPage from './SplashPage';
import { renderAtRoute } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

describe('SplashPage', () => {
  beforeEach(() => {
    vi.mocked(api.logEvent).mockResolvedValue(undefined);
    vi.mocked(api.fetchVenues).mockResolvedValue([
      { id: 1, name: 'Copper Dome Concierge', address: '123 Main St', configuration: {} },
    ]);
  });

  it('renders without errors', () => {
    renderAtRoute({ route: '/', routes: [{ path: '/', element: <SplashPage /> }] });
    expect(screen.getByText('Copper Dome')).toBeInTheDocument();
    expect(screen.getByText('Start Dining')).toBeInTheDocument();
  });

  it('fires session_started and navigates to /home when Start Dining is tapped', async () => {
    renderAtRoute({
      route: '/',
      routes: [
        { path: '/', element: <SplashPage /> },
        { path: '/home', element: <div>HOME STUB</div> },
      ],
    });

    fireEvent.click(screen.getByText('Start Dining'));

    await waitFor(() => {
      expect(api.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'session_started' })
      );
    });
    await screen.findByText('HOME STUB');
  });

  it('shows the Ask AI Concierge button as a non-functional placeholder', () => {
    renderAtRoute({
      route: '/',
      routes: [
        { path: '/', element: <SplashPage /> },
        { path: '/home', element: <div>HOME STUB</div> },
      ],
    });

    fireEvent.click(screen.getByText('Ask AI Concierge'));
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByText('HOME STUB')).not.toBeInTheDocument();
  });
});
