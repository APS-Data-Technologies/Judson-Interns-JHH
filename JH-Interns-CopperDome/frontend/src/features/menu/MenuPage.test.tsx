import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import MenuPage from './MenuPage';
import { renderAtRoute, seedSession, makeKitchen, makeMenuItem } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

describe('MenuPage', () => {
  beforeEach(() => {
    seedSession();
    vi.mocked(api.logEvent).mockResolvedValue(undefined);
    vi.mocked(api.fetchKitchens).mockResolvedValue([
      makeKitchen({ id: 1, name: 'The Copper Rail Kitchen' }),
      makeKitchen({ id: 2, name: 'Dome Garden Kitchen' }),
    ]);
    vi.mocked(api.fetchMenuItems).mockImplementation(async (kitchenId?: number) => {
      if (kitchenId === 1) {
        return [makeMenuItem({ id: 1, kitchen: 1, name: 'Smoked Clam Chowder' })];
      }
      if (kitchenId === 2) {
        return [makeMenuItem({ id: 10, kitchen: 2, name: 'Crispy Chickpea Bites', price: '8.00' })];
      }
      return [];
    });
  });

  it('renders without errors and shows the first kitchen selected by default', async () => {
    renderAtRoute({ route: '/menu', routes: [{ path: '/menu', element: <MenuPage /> }] });
    expect(await screen.findByText('Smoked Clam Chowder')).toBeInTheDocument();
    expect(api.fetchMenuItems).toHaveBeenCalledWith(1);
  });

  it('fires menu_viewed on load', async () => {
    renderAtRoute({ route: '/menu', routes: [{ path: '/menu', element: <MenuPage /> }] });
    await waitFor(() => {
      expect(api.logEvent).toHaveBeenCalledWith(expect.objectContaining({ eventType: 'menu_viewed' }));
    });
  });

  it('changes displayed items when a different kitchen pill is clicked, via the kitchen-filtered endpoint', async () => {
    renderAtRoute({ route: '/menu', routes: [{ path: '/menu', element: <MenuPage /> }] });
    await screen.findByText('Smoked Clam Chowder');

    fireEvent.click(screen.getByText('Dome Garden Kitchen'));

    expect(await screen.findByText('Crispy Chickpea Bites')).toBeInTheDocument();
    expect(screen.queryByText('Smoked Clam Chowder')).not.toBeInTheDocument();
    expect(api.fetchMenuItems).toHaveBeenCalledWith(2);
  });

  it('fires item_added_to_cart when the quick-add button is tapped', async () => {
    renderAtRoute({ route: '/menu', routes: [{ path: '/menu', element: <MenuPage /> }] });
    await screen.findByText('Smoked Clam Chowder');

    fireEvent.click(screen.getByLabelText('Add Smoked Clam Chowder to cart'));

    await waitFor(() => {
      expect(api.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'item_added_to_cart',
          metadata: expect.objectContaining({ menu_item_id: 1 }),
        })
      );
    });
  });
});
