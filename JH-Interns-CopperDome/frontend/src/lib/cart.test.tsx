import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartProvider, useCart } from './cart';
import { makeMenuItem } from '../test/utils';

function Harness() {
  const { lines, addItem, itemCount, subtotal } = useCart();
  return (
    <div>
      <button onClick={() => addItem(makeMenuItem({ id: 1, price: '9.00' }), 'The Copper Rail Kitchen')}>add</button>
      <span data-testid="line-count">{lines.length}</span>
      <span data-testid="item-count">{itemCount}</span>
      <span data-testid="subtotal">{subtotal}</span>
    </div>
  );
}

describe('CartProvider addItem', () => {
  it('merges quantity into the existing line instead of duplicating it when the same item is added twice', () => {
    render(
      <CartProvider>
        <Harness />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('add'));

    expect(screen.getByTestId('line-count').textContent).toBe('1');
    expect(screen.getByTestId('item-count').textContent).toBe('2');
    expect(screen.getByTestId('subtotal').textContent).toBe('18');
  });

  it('persists added items to localStorage immediately', () => {
    render(
      <CartProvider>
        <Harness />
      </CartProvider>
    );

    fireEvent.click(screen.getByText('add'));

    const stored = JSON.parse(window.localStorage.getItem('copperdome.cart') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].menuItem.id).toBe(1);
    expect(stored[0].quantity).toBe(1);
  });
});
