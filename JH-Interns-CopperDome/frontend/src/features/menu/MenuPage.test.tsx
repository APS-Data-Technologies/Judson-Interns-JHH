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
      // No kitchen filter — the unified across-all-kitchens browse.
      return [
        makeMenuItem({ id: 1, kitchen: 1, name: 'Smoked Clam Chowder' }),
        makeMenuItem({ id: 10, kitchen: 2, name: 'Crispy Chickpea Bites', price: '8.00' }),
      ];
    });
  });

  describe('dietary filters', () => {
    const withTags = [
      makeMenuItem({ id: 1, name: 'Grilled Artichoke', category: 'Starters', dietary_tags: ['V', 'GF'] }),
      makeMenuItem({ id: 2, name: 'Rail Burger', category: 'Mains', dietary_tags: [] }),
      makeMenuItem({ id: 3, name: 'Cacio e Pepe', category: 'Pasta', dietary_tags: ['V'] }),
      makeMenuItem({ id: 4, name: 'Arrabbiata', category: 'Pasta', dietary_tags: ['V', 'SP'] }),
    ];

    beforeEach(() => {
      vi.mocked(api.fetchMenuItems).mockResolvedValue(withTags);
    });

    const render = () =>
      renderAtRoute({ route: '/menu', routes: [{ path: '/menu', element: <MenuPage /> }] });

    it('only offers tags that exist on the current list', async () => {
      render();

      expect(await screen.findByRole('button', { name: /Vegetarian/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Gluten-Free/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Spicy/ })).toBeInTheDocument();
    });

    it('narrows to dishes carrying the selected tag', async () => {
      render();
      fireEvent.click(await screen.findByRole('button', { name: /Vegetarian/ }));

      expect(screen.getByText('Grilled Artichoke')).toBeInTheDocument();
      expect(screen.getByText('Cacio e Pepe')).toBeInTheDocument();
      expect(screen.queryByText('Rail Burger')).not.toBeInTheDocument();
    });

    it('requires every selected tag, not any of them', async () => {
      render();
      fireEvent.click(await screen.findByRole('button', { name: /Vegetarian/ }));
      fireEvent.click(screen.getByRole('button', { name: /Gluten-Free/ }));

      // "vegetarian AND gluten-free" is what the person asking actually means.
      expect(screen.getByText('Grilled Artichoke')).toBeInTheDocument();
      expect(screen.queryByText('Cacio e Pepe')).not.toBeInTheDocument();
    });

    it('composes with the category tabs rather than replacing them', async () => {
      render();
      fireEvent.click(await screen.findByRole('button', { name: /Vegetarian/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Pasta' }));

      expect(screen.getByText('Cacio e Pepe')).toBeInTheDocument();
      expect(screen.getByText('Arrabbiata')).toBeInTheDocument();
      expect(screen.queryByText('Grilled Artichoke')).not.toBeInTheDocument();
    });

    it('toggles a tag back off', async () => {
      render();
      const vegetarian = await screen.findByRole('button', { name: /Vegetarian/ });

      fireEvent.click(vegetarian);
      expect(screen.queryByText('Rail Burger')).not.toBeInTheDocument();

      fireEvent.click(vegetarian);
      expect(screen.getByText('Rail Burger')).toBeInTheDocument();
    });

    it('clears every filter at once', async () => {
      render();
      fireEvent.click(await screen.findByRole('button', { name: /Vegetarian/ }));
      fireEvent.click(screen.getByRole('button', { name: /Spicy/ }));

      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

      expect(screen.getByText('Rail Burger')).toBeInTheDocument();
    });

    it('explains an empty result and points at the concierge', async () => {
      render();
      fireEvent.click(await screen.findByRole('button', { name: /Gluten-Free/ }));
      fireEvent.click(screen.getByRole('button', { name: /Spicy/ }));

      expect(
        screen.getByText(/No dishes here are gluten-free and spicy/i)
      ).toBeInTheDocument();
    });

    it('exposes pressed state for assistive tech', async () => {
      render();
      const vegetarian = await screen.findByRole('button', { name: /Vegetarian/ });

      expect(vegetarian).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(vegetarian);
      expect(vegetarian).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('defaults to the unified all-kitchens browse', async () => {
    renderAtRoute({ route: '/menu', routes: [{ path: '/menu', element: <MenuPage /> }] });

    // Dishes from both kitchens appear together, unfiltered.
    expect(await screen.findByText('Smoked Clam Chowder')).toBeInTheDocument();
    expect(await screen.findByText('Crispy Chickpea Bites')).toBeInTheDocument();
    expect(api.fetchMenuItems).toHaveBeenCalledWith(undefined);
  });

  it('narrows to a single kitchen and back to All Kitchens', async () => {
    renderAtRoute({ route: '/menu', routes: [{ path: '/menu', element: <MenuPage /> }] });
    await screen.findByText('Crispy Chickpea Bites');

    // Kitchen names appear on the filter pills *and* on each dish card in the unified
    // view, so target the pill by role rather than by text alone.
    fireEvent.click(screen.getByRole('button', { name: 'The Copper Rail Kitchen' }));
    await waitFor(() => expect(api.fetchMenuItems).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.queryByText('Crispy Chickpea Bites')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'All Kitchens' }));
    expect(await screen.findByText('Crispy Chickpea Bites')).toBeInTheDocument();
    expect(await screen.findByText('Smoked Clam Chowder')).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: 'Dome Garden Kitchen' }));

    expect(await screen.findByText('Crispy Chickpea Bites')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Smoked Clam Chowder')).not.toBeInTheDocument());
    expect(api.fetchMenuItems).toHaveBeenCalledWith(2);
  });

  it('tags cart adds with the kitchen and which view they came from', async () => {
    renderAtRoute({ route: '/menu', routes: [{ path: '/menu', element: <MenuPage /> }] });
    await screen.findByText('Crispy Chickpea Bites');

    fireEvent.click(screen.getByLabelText('Add Crispy Chickpea Bites to cart'));

    await waitFor(() => {
      expect(api.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'item_added_to_cart',
          metadata: expect.objectContaining({ kitchen_id: 2, view: 'all_kitchens' }),
        })
      );
    });
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
