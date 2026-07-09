import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import DishDetailPage from './DishDetailPage';
import { renderAtRoute, seedSession, readCart, makeKitchen, makeMenuItem } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

describe('DishDetailPage', () => {
  beforeEach(() => {
    seedSession();
    vi.mocked(api.logEvent).mockResolvedValue(undefined);
    vi.mocked(api.fetchMenuItem).mockResolvedValue(
      makeMenuItem({ id: 1, kitchen: 1, name: 'Smoked Clam Chowder', price: '9.00' })
    );
    vi.mocked(api.fetchKitchens).mockResolvedValue([makeKitchen({ id: 1, name: 'The Copper Rail Kitchen' })]);
  });

  it('renders without errors', async () => {
    renderAtRoute({ route: '/menu/1', routes: [{ path: '/menu/:id', element: <DishDetailPage /> }] });
    expect(await screen.findByText('Smoked Clam Chowder')).toBeInTheDocument();
  });

  it('fires menu_item_viewed on load with the correct item id', async () => {
    renderAtRoute({ route: '/menu/1', routes: [{ path: '/menu/:id', element: <DishDetailPage /> }] });
    await waitFor(() => {
      expect(api.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'menu_item_viewed',
          metadata: { menu_item_id: 1 },
        })
      );
    });
  });

  it('fires item_added_to_cart and updates cart state when Add to Cart is tapped', async () => {
    renderAtRoute({ route: '/menu/1', routes: [{ path: '/menu/:id', element: <DishDetailPage /> }] });
    await screen.findByText('Smoked Clam Chowder');

    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));

    await waitFor(() => {
      expect(api.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'item_added_to_cart',
          metadata: expect.objectContaining({ menu_item_id: 1, source: 'dish_details' }),
        })
      );
    });

    const cart = readCart();
    expect(cart).toHaveLength(1);
    expect(cart[0].menuItem.name).toBe('Smoked Clam Chowder');
    expect(cart[0].quantity).toBe(1);
    expect(await screen.findByText('Added to Cart')).toBeInTheDocument();
  });
});
