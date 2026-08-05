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
      sessions_issued: 16,
      sessions_opted_in: 12,
      opt_in_rate: 0.75,
      concierge_open_rate: 0.5,
      ai_queries_per_session: 2.25,
      request_types_by_frequency: { water: 3, call_server: 1 },
      menu_to_cart_drop_off: 0.25,
      median_session_duration_seconds: 125,
      event_counts: {
        session_started: 12,
        menu_viewed: 11,
        menu_item_viewed: 9,
        ai_question_asked: 27,
        item_added_to_cart: 8,
        mock_checkout_started: 5,
        mock_checkout_completed: 4,
        service_request_created: 4,
      },
      event_types_fired: 8,
      event_types_total: 8,
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
