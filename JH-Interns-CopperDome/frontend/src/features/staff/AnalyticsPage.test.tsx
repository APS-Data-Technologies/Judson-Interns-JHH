import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AnalyticsPage from './AnalyticsPage';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

function renderAnalytics() {
  return render(
    <MemoryRouter initialEntries={['/staff/analytics']}>
      <Routes>
        <Route path="/staff/analytics" element={<AnalyticsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AnalyticsPage', () => {
  it('renders the required engagement metrics', async () => {
    vi.mocked(api.fetchAnalytics).mockResolvedValue({
      total_sessions: 12,
      concierge_open_rate: 0.5,
      ai_queries_per_session: 2.25,
      request_types_by_frequency: { water: 3, call_server: 1 },
      menu_to_cart_drop_off: 0.25,
      median_session_duration_seconds: 125,
    });

    renderAnalytics();

    expect(await screen.findByText('12')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('2.3')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByText('2m 5s')).toBeInTheDocument();
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows an error state when analytics fails to load', async () => {
    vi.mocked(api.fetchAnalytics).mockRejectedValue(new Error('network error'));
    renderAnalytics();

    expect(await screen.findByText(/Couldn't load analytics/)).toBeInTheDocument();
  });
});
