import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import PrivateRoute from './PrivateRoute';

const mockUseAuth = vi.fn();

vi.mock('../../features/auth/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('PrivateRoute', () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
  });

  it('mostra loading enquanto autenticação carrega', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });

    render(
      <MemoryRouter initialEntries={['/contas-a-pagar']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/contas-a-pagar" element={<div>Privada</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redireciona para login quando não autenticado', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false });

    render(
      <MemoryRouter initialEntries={['/contas-a-pagar']}>
        <Routes>
          <Route path="/login" element={<div>Tela de login</div>} />
          <Route element={<PrivateRoute />}>
            <Route path="/contas-a-pagar" element={<div>Privada</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('renderiza conteúdo privado quando autenticado', () => {
    mockUseAuth.mockReturnValue({ user: { uid: '123' }, loading: false });

    render(
      <MemoryRouter initialEntries={['/contas-a-pagar']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/contas-a-pagar" element={<div>Privada</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Privada')).toBeInTheDocument();
  });
});
