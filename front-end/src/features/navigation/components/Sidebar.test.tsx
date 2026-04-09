import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { UserProfile } from '../../../shared/types/common.types';

const mockUseAuth = vi.fn();

vi.mock('../../auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function makeProfile(role: UserProfile['role']): UserProfile {
  return {
    uid: `user-${role}`,
    email: `${role}@teste.com`,
    role,
    tenantId: 'tenant-1',
    tenantName: 'Transportadora Teste',
    tenantSlug: 'transportadora-teste',
  };
}

function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

describe('Sidebar', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('navega para a rota do item clicado no menu', () => {
    mockUseAuth.mockReturnValue({ userProfile: makeProfile('admin') });

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="*"
            element={
              <>
                <Sidebar activeItem="dashboard" />
                <LocationDisplay />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /cadastros/i }));
    fireEvent.click(screen.getByRole('button', { name: /veiculos/i }));

    expect(screen.getByTestId('location-display')).toHaveTextContent('/veiculos');
  });
});
