import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import OrderStatusPage from './OrderStatusPage';
import { renderAtRoute, seedSession, makeServiceRequest } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

describe('OrderStatusPage', () => {
  beforeEach(() => {
    vi.mocked(api.createServiceRequest).mockResolvedValue(makeServiceRequest());
  });

  it('renders without errors', () => {
    seedSession();
    renderAtRoute({ route: '/order-status', routes: [{ path: '/order-status', element: <OrderStatusPage /> }] });
    expect(screen.getByText('Your order is being prepared')).toBeInTheDocument();
    expect(screen.getByText('18 mins')).toBeInTheDocument();
  });

  it('fires a call-server request and confirms it with a toast', async () => {
    seedSession({ tableNumber: '04' });
    renderAtRoute({ route: '/order-status', routes: [{ path: '/order-status', element: <OrderStatusPage /> }] });
    fireEvent.click(screen.getByText('Request Service'));

    await waitFor(() => {
      expect(api.createServiceRequest).toHaveBeenCalledWith('test-session-id', '04', 'call_server');
    });
    expect(await screen.findByText('A server has been notified')).toBeInTheDocument();
  });

  it('navigates to the AI concierge', async () => {
    seedSession();
    renderAtRoute({
      route: '/order-status',
      routes: [
        { path: '/order-status', element: <OrderStatusPage /> },
        { path: '/concierge', element: <div>CONCIERGE STUB</div> },
      ],
    });
    fireEvent.click(screen.getByText('Ask Concierge'));
    expect(await screen.findByText('CONCIERGE STUB')).toBeInTheDocument();
  });
});
