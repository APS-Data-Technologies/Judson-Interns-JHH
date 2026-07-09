import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import CheckoutPage from './CheckoutPage';
import { renderAtRoute, seedSession, seedCart, readCart, makeMenuItem } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

function renderCheckout() {
  return renderAtRoute({
    route: '/checkout',
    routes: [
      { path: '/checkout', element: <CheckoutPage /> },
      { path: '/order-status', element: <div>ORDER STATUS STUB</div> },
      { path: '/cart', element: <div>CART STUB</div> },
    ],
  });
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    seedSession();
    vi.mocked(api.logEvent).mockResolvedValue(undefined);
  });

  it('renders without errors and shows the mock payment section', () => {
    seedCart([{ menuItem: makeMenuItem({ id: 1, price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 }]);
    renderCheckout();
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText('Card on file ending in 4242 (mock)')).toBeInTheDocument();
  });

  it('redirects to /cart when reached with an empty cart', async () => {
    renderCheckout();
    expect(await screen.findByText('CART STUB')).toBeInTheDocument();
  });

  it('fires mock_checkout_started on load with the correct total', async () => {
    seedCart([
      { menuItem: makeMenuItem({ id: 1, price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 },
      { menuItem: makeMenuItem({ id: 4, name: 'Cedar Plank Salmon', price: '22.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 },
    ]);
    renderCheckout();

    await waitFor(() => {
      expect(api.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'mock_checkout_started',
          metadata: expect.objectContaining({ total: 39.22 }),
        })
      );
    });
  });

  it('fires mock_checkout_completed, clears the cart, and navigates to Order Status on Complete Order', async () => {
    seedCart([{ menuItem: makeMenuItem({ id: 1, price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 }]);
    renderCheckout();
    await screen.findByText('Order Summary');

    fireEvent.click(screen.getByRole('button', { name: 'Complete Order' }));

    await waitFor(() => {
      expect(api.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({ eventType: 'mock_checkout_completed' })
      );
    });
    expect(await screen.findByText('ORDER STATUS STUB')).toBeInTheDocument();
    expect(readCart()).toHaveLength(0);
  });
});
