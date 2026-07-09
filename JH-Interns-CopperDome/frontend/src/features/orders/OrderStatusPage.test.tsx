import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import OrderStatusPage from './OrderStatusPage';
import { renderAtRoute, seedSession } from '../../test/utils';

describe('OrderStatusPage', () => {
  it('renders without errors', () => {
    seedSession();
    renderAtRoute({ route: '/order-status', routes: [{ path: '/order-status', element: <OrderStatusPage /> }] });
    expect(screen.getByText('Your order is being prepared')).toBeInTheDocument();
    expect(screen.getByText('18 mins')).toBeInTheDocument();
  });

  it('shows Ask Concierge / Request Service as non-functional placeholders', () => {
    seedSession();
    renderAtRoute({ route: '/order-status', routes: [{ path: '/order-status', element: <OrderStatusPage /> }] });
    fireEvent.click(screen.getByText('Request Service'));
    expect(screen.getByText('Coming soon')).toBeInTheDocument();
  });
});
