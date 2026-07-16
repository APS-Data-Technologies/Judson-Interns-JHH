import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ConciergePage from './ConciergePage';
import { renderAtRoute, seedSession } from '../../test/utils';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

function renderConcierge() {
  return renderAtRoute({
    route: '/concierge',
    routes: [{ path: '/concierge', element: <ConciergePage /> }],
  });
}

describe('ConciergePage', () => {
  beforeEach(() => {
    seedSession();
  });

  it('renders the empty state with quick suggestions', () => {
    renderConcierge();
    expect(screen.getByText('AI Concierge')).toBeInTheDocument();
    expect(screen.getByText('What do you recommend tonight?')).toBeInTheDocument();
  });

  it('sends a question and renders the reply', async () => {
    vi.mocked(api.askConcierge).mockResolvedValue('The chowder pairs nicely with our sourdough.');
    renderConcierge();

    fireEvent.change(screen.getByPlaceholderText('Ask about the menu...'), {
      target: { value: 'What pairs with the chowder?' },
    });
    fireEvent.click(screen.getByText('Ask'));

    expect(await screen.findByText('What pairs with the chowder?')).toBeInTheDocument();
    await waitFor(() => {
      expect(api.askConcierge).toHaveBeenCalledWith('test-session-id', 'What pairs with the chowder?', []);
    });
    expect(await screen.findByText('The chowder pairs nicely with our sourdough.')).toBeInTheDocument();
  });

  it('sends a quick-suggestion chip as a question', async () => {
    vi.mocked(api.askConcierge).mockResolvedValue('Try the Cedar Plank Salmon.');
    renderConcierge();

    fireEvent.click(screen.getByText('What do you recommend tonight?'));

    await waitFor(() => {
      expect(api.askConcierge).toHaveBeenCalledWith('test-session-id', 'What do you recommend tonight?', []);
    });
    expect(await screen.findByText('Try the Cedar Plank Salmon.')).toBeInTheDocument();
  });

  it('shows a fallback message when the concierge call fails', async () => {
    vi.mocked(api.askConcierge).mockRejectedValue(new Error('network error'));
    renderConcierge();

    fireEvent.change(screen.getByPlaceholderText('Ask about the menu...'), {
      target: { value: 'Hello' },
    });
    fireEvent.click(screen.getByText('Ask'));

    expect(await screen.findByText(/couldn't respond just now/)).toBeInTheDocument();
  });
});
