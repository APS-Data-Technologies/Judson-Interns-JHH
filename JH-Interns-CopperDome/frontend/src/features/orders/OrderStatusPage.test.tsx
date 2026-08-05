import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import OrderStatusPage from './OrderStatusPage';
import { renderAtRoute, seedSession, makeServiceRequest, makeOrder } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

function render() {
  return renderAtRoute({
    route: '/order-status',
    routes: [
      { path: '/order-status', element: <OrderStatusPage /> },
      { path: '/concierge', element: <div>CONCIERGE STUB</div> },
      { path: '/orders', element: <div>ORDERS STUB</div> },
      { path: '/menu', element: <div>MENU STUB</div> },
    ],
  });
}

describe('OrderStatusPage', () => {
  beforeEach(() => {
    seedSession({ tableNumber: '04' });
    vi.mocked(api.createServiceRequest).mockResolvedValue(makeServiceRequest());
    vi.mocked(api.fetchMyOrders).mockResolvedValue([makeOrder()]);
  });

  it('shows the real order, its dishes and its total', async () => {
    render();

    expect(await screen.findByText('Order #7')).toBeInTheDocument();
    expect(screen.getByText('1× Smoked Clam Chowder')).toBeInTheDocument();
    expect(screen.getByText('2× Crispy Chickpea Bites')).toBeInTheDocument();
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('reflects the kitchen status rather than a fixed message', async () => {
    vi.mocked(api.fetchMyOrders).mockResolvedValue([makeOrder({ status: 'ready' })]);
    render();

    // The kitchen display advances the ticket; this screen must follow it.
    expect(await screen.findByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('A server is bringing it over.')).toBeInTheDocument();
  });

  it('tells the patron when they have not ordered yet', async () => {
    vi.mocked(api.fetchMyOrders).mockResolvedValue([]);
    render();

    expect(await screen.findByText('No order yet')).toBeInTheDocument();
  });

  it('keeps the last known order when a refresh fails', async () => {
    render();
    await screen.findByText('Order #7');

    vi.mocked(api.fetchMyOrders).mockRejectedValue(new Error('offline'));

    // A dropped poll must not blank the screen the patron is watching.
    expect(screen.getByText('Order #7')).toBeInTheDocument();
  });

  it('fires a call-server request and confirms it with a toast', async () => {
    render();
    fireEvent.click(await screen.findByText('Request Service'));

    await waitFor(() => {
      expect(api.createServiceRequest).toHaveBeenCalledWith('test-session-id', '04', 'call_server');
    });
    expect(await screen.findByText('A server has been notified')).toBeInTheDocument();
  });

  it('navigates to the AI concierge', async () => {
    render();
    fireEvent.click(await screen.findByText('Ask Concierge'));
    expect(await screen.findByText('CONCIERGE STUB')).toBeInTheDocument();
  });

  it('links through to the full order history', async () => {
    render();
    fireEvent.click(await screen.findByText('View all my orders'));
    expect(await screen.findByText('ORDERS STUB')).toBeInTheDocument();
  });
});
