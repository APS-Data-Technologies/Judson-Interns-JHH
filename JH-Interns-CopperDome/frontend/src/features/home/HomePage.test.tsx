import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import HomePage from './HomePage';
import { renderAtRoute, seedSession, makeKitchen, makeMenuItem } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

describe('HomePage', () => {
  beforeEach(() => {
    seedSession({ venueName: 'Copper Dome Concierge', tableNumber: '04' });
    vi.mocked(api.fetchKitchens).mockResolvedValue([makeKitchen({ id: 1, name: 'The Copper Rail Kitchen' })]);
    vi.mocked(api.fetchMenuItems).mockResolvedValue([
      makeMenuItem({ id: 1, name: 'Smoked Clam Chowder' }),
      makeMenuItem({ id: 2, name: 'Grilled Artichoke' }),
    ]);
  });

  it('renders without errors, showing venue/table and highlight cards', async () => {
    renderAtRoute({ route: '/home', routes: [{ path: '/home', element: <HomePage /> }] });
    expect(screen.getByText('Copper Dome Concierge')).toBeInTheDocument();
    expect(screen.getByText('Table 04')).toBeInTheDocument();
    expect(await screen.findByText('Smoked Clam Chowder')).toBeInTheDocument();
    expect(await screen.findByText('Grilled Artichoke')).toBeInTheDocument();
  });

  it('navigates to Menu when Browse Menu is tapped', async () => {
    renderAtRoute({
      route: '/home',
      routes: [
        { path: '/home', element: <HomePage /> },
        { path: '/menu', element: <div>MENU STUB</div> },
      ],
    });
    fireEvent.click(screen.getByText('Browse Menu'));
    expect(await screen.findByText('MENU STUB')).toBeInTheDocument();
  });

  it('shows disabled tiles as non-functional placeholders', async () => {
    renderAtRoute({
      route: '/home',
      routes: [
        { path: '/home', element: <HomePage /> },
        { path: '/menu', element: <div>MENU STUB</div> },
      ],
    });
    fireEvent.click(screen.getByText('Need Water'));
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
    expect(screen.queryByText('MENU STUB')).not.toBeInTheDocument();
  });
});
