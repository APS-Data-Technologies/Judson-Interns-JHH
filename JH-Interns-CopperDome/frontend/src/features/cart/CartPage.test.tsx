import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import CartPage from './CartPage';
import { renderAtRoute, seedSession, seedCart, readCart, makeMenuItem } from '../../test/utils';

describe('CartPage', () => {
  beforeEach(() => {
    seedSession();
  });

  it('renders without errors when empty', () => {
    renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });
    expect(screen.getByText('Your cart is empty. Browse the menu to add a dish.')).toBeInTheDocument();
  });

  it('shows a loyalty points indicator for the order', () => {
    seedCart([{ menuItem: makeMenuItem({ price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 }]);
    renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });
    expect(screen.getByText(/pts with this order/)).toBeInTheDocument();
  });

  it('increments and decrements quantity, updating the subtotal', () => {
    seedCart([{ menuItem: makeMenuItem({ id: 1, price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 }]);
    renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });
    const stepper = () => within(screen.getByLabelText('Increase quantity').closest('.stepper') as HTMLElement);

    fireEvent.click(screen.getByLabelText('Increase quantity'));
    expect(stepper().getByText('2')).toBeInTheDocument();
    expect(readCart()[0].quantity).toBe(2);

    fireEvent.click(screen.getByLabelText('Decrease quantity'));
    expect(stepper().getByText('1')).toBeInTheDocument();
    expect(readCart()[0].quantity).toBe(1);
  });

  it('removes an item entirely when its trash icon is tapped', () => {
    seedCart([
      { menuItem: makeMenuItem({ id: 1, name: 'Smoked Clam Chowder', price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 },
      { menuItem: makeMenuItem({ id: 2, name: 'Grilled Artichoke', price: '11.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 },
    ]);
    renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });

    fireEvent.click(screen.getByLabelText('Remove Smoked Clam Chowder'));

    expect(screen.queryByText('Smoked Clam Chowder')).not.toBeInTheDocument();
    expect(screen.getByText('Grilled Artichoke')).toBeInTheDocument();
    expect(readCart()).toHaveLength(1);
  });

  it('decrementing quantity to zero removes the line and shows the empty state', () => {
    seedCart([{ menuItem: makeMenuItem({ id: 1, price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 }]);
    renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });

    fireEvent.click(screen.getByLabelText('Decrease quantity'));

    expect(screen.getByText('Your cart is empty. Browse the menu to add a dish.')).toBeInTheDocument();
    expect(readCart()).toHaveLength(0);
  });

  it('persists across a simulated reload via localStorage', () => {
    seedCart([{ menuItem: makeMenuItem({ id: 1, name: 'Smoked Clam Chowder', price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 2 }]);

    const first = renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });
    expect(screen.getByText('Smoked Clam Chowder')).toBeInTheDocument();
    first.unmount();

    // A fresh render is functionally a page reload: a brand-new CartProvider
    // that hydrates only from localStorage, with no in-memory state carried over.
    renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });
    expect(screen.getByText('Smoked Clam Chowder')).toBeInTheDocument();
    expect(readCart()[0].quantity).toBe(2);
  });

  it('calculates checkout totals correctly for combination 1 (two items, single kitchen)', () => {
    seedCart([
      { menuItem: makeMenuItem({ id: 1, name: 'Smoked Clam Chowder', price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 },
      { menuItem: makeMenuItem({ id: 4, name: 'Cedar Plank Salmon', price: '22.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 },
    ]);
    renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });

    expect(screen.getByText('$31.00')).toBeInTheDocument(); // subtotal
    expect(screen.getByText('$2.64')).toBeInTheDocument(); // tax @ 8.5%
    expect(screen.getByText('$5.58')).toBeInTheDocument(); // service charge @ 18%
    expect(screen.getByText('$39.22')).toBeInTheDocument(); // total
  });

  it('calculates checkout totals correctly for combination 2 (three items across kitchens)', () => {
    seedCart([
      { menuItem: makeMenuItem({ id: 1, name: 'Smoked Clam Chowder', price: '9.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 },
      { menuItem: makeMenuItem({ id: 2, name: 'Grilled Artichoke', price: '11.00' }), kitchenName: 'The Copper Rail Kitchen', quantity: 1 },
      { menuItem: makeMenuItem({ id: 12, name: 'Crispy Chickpea Bites', price: '6.00', kitchen: 2 }), kitchenName: 'Dome Garden Kitchen', quantity: 1 },
    ]);
    renderAtRoute({ route: '/cart', routes: [{ path: '/cart', element: <CartPage /> }] });

    expect(screen.getByText('$26.00')).toBeInTheDocument(); // subtotal
    expect(screen.getByText('$2.21')).toBeInTheDocument(); // tax @ 8.5%
    expect(screen.getByText('$4.68')).toBeInTheDocument(); // service charge @ 18%
    expect(screen.getByText('$32.89')).toBeInTheDocument(); // total
  });
});
