import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import StaffFeedPage from './StaffFeedPage';
import { makeServiceRequest } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

let latestOnMessage: ((message: unknown) => void) | undefined;
vi.mock('../../lib/staffSocket', () => ({
  useStaffFeed: (onMessage: (message: unknown) => void) => {
    latestOnMessage = onMessage;
    return { connected: true };
  },
}));

function renderStaffFeed() {
  return render(
    <MemoryRouter initialEntries={['/staff']}>
      <Routes>
        <Route path="/staff" element={<StaffFeedPage />} />
        <Route path="/staff/analytics" element={<div>ANALYTICS STUB</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('StaffFeedPage', () => {
  beforeEach(() => {
    latestOnMessage = undefined;
  });

  it('hydrates from fetchServiceRequests and renders open requests', async () => {
    vi.mocked(api.fetchServiceRequests).mockResolvedValue([
      makeServiceRequest({ id: 1, request_type: 'water', table_number: '04', status: 'pending' }),
    ]);
    renderStaffFeed();

    expect(await screen.findByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Table 04')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('shows an empty state when there are no open requests', async () => {
    vi.mocked(api.fetchServiceRequests).mockResolvedValue([]);
    renderStaffFeed();

    expect(await screen.findByText('No open requests right now.')).toBeInTheDocument();
  });

  it('advances a pending request to acknowledged, then resolved', async () => {
    const pending = makeServiceRequest({ id: 1, request_type: 'call_server', status: 'pending' });
    vi.mocked(api.fetchServiceRequests).mockResolvedValue([pending]);
    vi.mocked(api.updateServiceRequestStatus).mockResolvedValue({ ...pending, status: 'acknowledged' });
    renderStaffFeed();

    fireEvent.click(await screen.findByText('Acknowledge'));

    await waitFor(() => {
      expect(api.updateServiceRequestStatus).toHaveBeenCalledWith(1, 'acknowledged');
    });
    expect(await screen.findByText('Acknowledged')).toBeInTheDocument();
  });

  it('merges a live service_request_created event from the staff feed', async () => {
    vi.mocked(api.fetchServiceRequests).mockResolvedValue([]);
    renderStaffFeed();
    await screen.findByText('No open requests right now.');

    latestOnMessage?.({
      event: 'service_request_created',
      request: makeServiceRequest({ id: 9, request_type: 'surprise_me', table_number: '07', status: 'pending' }),
    });

    expect(await screen.findByText('Surprise Me')).toBeInTheDocument();
    expect(screen.getByText('Table 07')).toBeInTheDocument();
  });
});
