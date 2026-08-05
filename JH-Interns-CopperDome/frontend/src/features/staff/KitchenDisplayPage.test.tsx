import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import KitchenDisplayPage from './KitchenDisplayPage';
import type { KitchenStation } from '../../lib/types';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

function makeStations(): KitchenStation[] {
  return [
    {
      kitchen_id: 1,
      kitchen_name: 'The Copper Rail Kitchen',
      tickets: [
        {
          order_id: 7,
          table_number: '04',
          status: 'placed',
          placed_at: new Date().toISOString(),
          lines: [{ name: 'Smoked Clam Chowder', quantity: 1 }],
        },
      ],
    },
    {
      kitchen_id: 2,
      kitchen_name: 'Dome Garden Kitchen',
      tickets: [
        {
          order_id: 7,
          table_number: '04',
          status: 'preparing',
          placed_at: new Date().toISOString(),
          lines: [{ name: 'Crispy Chickpea Bites', quantity: 2 }],
        },
      ],
    },
    { kitchen_id: 3, kitchen_name: 'Fiamma & Co.', tickets: [] },
  ];
}

function renderKds() {
  return render(
    <MemoryRouter initialEntries={['/staff/kitchen']}>
      <Routes>
        <Route path="/staff/kitchen" element={<KitchenDisplayPage />} />
        <Route path="/staff" element={<div>FLOOR STUB</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('KitchenDisplayPage', () => {
  beforeEach(() => {
    vi.mocked(api.fetchKitchenDisplay).mockResolvedValue(makeStations());
    vi.mocked(api.advanceOrder).mockResolvedValue(undefined);
  });

  it('shows one station per kitchen with only that kitchen’s lines', async () => {
    renderKds();

    expect(await screen.findByText('The Copper Rail Kitchen')).toBeInTheDocument();
    expect(screen.getByText('Dome Garden Kitchen')).toBeInTheDocument();
    // The same order (id 7) appears in both stations, split by kitchen.
    expect(screen.getByText('Smoked Clam Chowder')).toBeInTheDocument();
    expect(screen.getByText('Crispy Chickpea Bites')).toBeInTheDocument();
  });

  it('labels the next action from the ticket status', async () => {
    renderKds();

    // placed -> "Start", preparing -> "Ready"
    expect(await screen.findByRole('button', { name: /Start/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ready/ })).toBeInTheDocument();
  });

  it('advances a ticket and refetches', async () => {
    renderKds();
    const button = await screen.findByRole('button', { name: /Start/ });
    const callsBefore = vi.mocked(api.fetchKitchenDisplay).mock.calls.length;

    fireEvent.click(button);

    await waitFor(() => expect(api.advanceOrder).toHaveBeenCalledWith(7));
    // Re-reads the board so the ticket moves without waiting for the poll interval.
    await waitFor(() =>
      expect(vi.mocked(api.fetchKitchenDisplay).mock.calls.length).toBeGreaterThan(callsBefore),
    );
  });

  it('shows an all-caught-up state when nothing is open', async () => {
    vi.mocked(api.fetchKitchenDisplay).mockResolvedValue([
      { kitchen_id: 1, kitchen_name: 'The Copper Rail Kitchen', tickets: [] },
    ]);

    renderKds();

    expect(await screen.findByText('No open tickets. All caught up.')).toBeInTheDocument();
  });
});
