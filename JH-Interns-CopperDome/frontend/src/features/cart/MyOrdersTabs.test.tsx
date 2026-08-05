import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import CartPage from './CartPage';
import { renderAtRoute, seedSession, seedCart, makeOrder, makeMenuItem } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

function render(element = <CartPage />) {
  return renderAtRoute({
    route: '/cart',
    routes: [
      { path: '/cart', element },
      { path: '/order-status', element: <div>STATUS STUB</div> },
    ],
  });
}

const placed = makeOrder({ id: 30, status: 'preparing', total: '25.00' });
const served = makeOrder({ id: 20, status: 'served', total: '18.00' });
const declined = makeOrder({ id: 10, status: 'declined', total: '31.00' });

describe('My Orders tabs', () => {
  beforeEach(() => {
    seedSession();
    vi.mocked(api.fetchMyOrders).mockResolvedValue([placed, served, declined]);
  });

  it('opens on Your Order, which is the current cart', () => {
    seedCart([
      {
        menuItem: makeMenuItem({ id: 1, name: 'Smoked Clam Chowder', price: '9.00' }),
        kitchenName: 'The Copper Rail Kitchen',
        quantity: 2,
      },
    ]);
    render();

    // The cart is what's still being assembled, not something sent to the kitchen.
    expect(screen.getByText('Smoked Clam Chowder')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.queryByText('Order #30')).not.toBeInTheDocument();
  });

  it('counts cart items on the Your Order tab', () => {
    seedCart([
      { menuItem: makeMenuItem({ id: 1, price: '9.00' }), kitchenName: 'K', quantity: 2 },
      { menuItem: makeMenuItem({ id: 2, price: '5.00' }), kitchenName: 'K', quantity: 1 },
    ]);
    render();

    expect(screen.getByRole('button', { name: 'Your Order (3)' })).toBeInTheDocument();
  });

  it('shows placed, served and declined orders under All Orders', async () => {
    render();
    fireEvent.click(await screen.findByRole('button', { name: /All Orders/ }));

    expect(screen.getByText('Order #30')).toBeInTheDocument();
    expect(screen.getByText('Order #20')).toBeInTheDocument();
    expect(screen.getByText('Order #10')).toBeInTheDocument();
    expect(screen.getByText('Being prepared')).toBeInTheDocument();
    expect(screen.getByText('Served')).toBeInTheDocument();
    expect(screen.getByText('Payment declined')).toBeInTheDocument();
  });

  it('counts placed orders on the All Orders tab', async () => {
    render();

    expect(await screen.findByRole('button', { name: 'All Orders (3)' })).toBeInTheDocument();
  });

  it('opens directly on All Orders when reached from the ⋯ menu', async () => {
    render(<CartPage initialTab="all" />);

    expect(await screen.findByText('Order #30')).toBeInTheDocument();
    expect(screen.queryByText('Checkout')).not.toBeInTheDocument();
  });

  it('switches back to the cart without losing it', async () => {
    seedCart([
      { menuItem: makeMenuItem({ id: 1, name: 'Smoked Clam Chowder', price: '9.00' }), kitchenName: 'K', quantity: 1 },
    ]);
    render();

    fireEvent.click(await screen.findByRole('button', { name: /All Orders/ }));
    expect(screen.queryByText('Checkout')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Your Order/ }));
    expect(screen.getByText('Smoked Clam Chowder')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });

  it('opens an order from the list', async () => {
    render(<CartPage initialTab="all" />);
    fireEvent.click(await screen.findByText('Order #30'));

    expect(await screen.findByText('STATUS STUB')).toBeInTheDocument();
  });

  it('keeps the cart usable when order history fails to load', () => {
    vi.mocked(api.fetchMyOrders).mockRejectedValue(new Error('offline'));
    seedCart([
      { menuItem: makeMenuItem({ id: 1, name: 'Smoked Clam Chowder', price: '9.00' }), kitchenName: 'K', quantity: 1 },
    ]);
    render();

    // A dead history endpoint must never block someone from checking out.
    expect(screen.getByText('Smoked Clam Chowder')).toBeInTheDocument();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });
});
