import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StaffAuthGate from './StaffAuthGate';
import { getStaffToken, setStaffToken } from '../../lib/auth';

vi.mock('../../lib/api');
import * as api from '../../lib/api';

describe('StaffAuthGate', () => {
  beforeEach(() => {
    setStaffToken(null);
  });

  afterEach(() => {
    setStaffToken(null);
  });

  it('hides staff content behind a sign-in form', () => {
    render(
      <StaffAuthGate>
        <div>FLOOR VIEW</div>
      </StaffAuthGate>
    );

    expect(screen.getByText('Staff sign in')).toBeInTheDocument();
    expect(screen.queryByText('FLOOR VIEW')).not.toBeInTheDocument();
  });

  it('stores the token and reveals the content after a successful sign in', async () => {
    vi.mocked(api.staffLogin).mockResolvedValue('staff-token-123');

    render(
      <StaffAuthGate>
        <div>FLOOR VIEW</div>
      </StaffAuthGate>
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'floor' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('FLOOR VIEW')).toBeInTheDocument();
    await waitFor(() => expect(getStaffToken()).toBe('staff-token-123'));
  });

  it('keeps the content hidden when the credentials are rejected', async () => {
    vi.mocked(api.staffLogin).mockRejectedValue(new Error('401'));

    render(
      <StaffAuthGate>
        <div>FLOOR VIEW</div>
      </StaffAuthGate>
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'floor' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Those credentials were not accepted.');
    expect(screen.queryByText('FLOOR VIEW')).not.toBeInTheDocument();
    expect(getStaffToken()).toBeNull();
  });

  it('shows content immediately when a token is already stored, and clears it on sign out', async () => {
    setStaffToken('existing-token');

    render(
      <StaffAuthGate>
        <div>FLOOR VIEW</div>
      </StaffAuthGate>
    );

    expect(screen.getByText('FLOOR VIEW')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByText('Staff sign in')).toBeInTheDocument();
    expect(getStaffToken()).toBeNull();
  });
});
