import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TableStatusStrip from './TableStatusStrip';
import type { TableState } from '../../lib/types';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

function makeTable(overrides: Partial<TableState> = {}): TableState {
  return {
    table_number: '04',
    status: 'seated',
    open_requests: 0,
    oldest_request_at: null,
    open_orders: 0,
    order_status: null,
    last_activity: new Date().toISOString(),
    ...overrides,
  };
}

describe('TableStatusStrip', () => {
  beforeEach(() => {
    vi.mocked(api.fetchTableStates).mockResolvedValue([]);
  });

  it('renders nothing when no table has activity', async () => {
    const { container } = render(<TableStatusStrip />);
    expect(container.querySelector('.table-status')).toBeNull();
  });

  it('summarises each status and badges open requests', async () => {
    vi.mocked(api.fetchTableStates).mockResolvedValue([
      makeTable({ table_number: '02', status: 'needs_attention', open_requests: 2 }),
      makeTable({ table_number: '05', status: 'order_open', open_orders: 1, order_status: 'preparing' }),
      makeTable({ table_number: '09', status: 'seated' }),
    ]);

    render(<TableStatusStrip />);

    expect(await screen.findByText('1 need attention · 1 cooking · 1 seated')).toBeInTheDocument();
    // The open-request count is badged onto the table chip.
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTitle('Table 02 — Needs attention')).toBeInTheDocument();
    expect(screen.getByTitle('Table 05 — Order in progress')).toBeInTheDocument();
  });

  it('stays quiet when the table endpoint fails', async () => {
    vi.mocked(api.fetchTableStates).mockRejectedValue(new Error('offline'));

    const { container } = render(<TableStatusStrip />);

    // The request feed is the primary surface — a failed roster must not blank the page.
    expect(container.querySelector('.table-status')).toBeNull();
  });
});
