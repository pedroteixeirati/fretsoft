import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import PublicRoute from './PublicRoute';
import { UserProfile } from '../../shared/types/common.types';

const mockUseAuth = vi.fn();

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function makeProfile(role: UserProfile['role']): UserProfile {
  return {
    uid: `user-${role}`,
    email: `${role}@teste.com`,
    role,
    tenantId: 'tenant-1',
    tenantName: 'Tenant Teste',
    tenantSlug: 'tenant-teste',
  };
}

describe('PublicRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('mostra loading enquanto autenticação carrega', () => {
    mockUseAuth.mockReturnValue({ user: null, userProfile: null, loading: true });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redireciona usuário autenticado com perfil para a primeira rota permitida', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      userProfile: makeProfile('financial'),
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login</div>} />
          </Route>
          <Route path="/veiculos" element={<div>Veículos</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Veículos')).toBeInTheDocument();
  });

  it('redireciona para acesso pendente quando usuário não tem perfil', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: '123' },
      userProfile: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<div>Login</div>} />
          </Route>
          <Route path="/acesso-pendente" element={<div>Acesso pendente</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Acesso pendente')).toBeInTheDocument();
  });
});
