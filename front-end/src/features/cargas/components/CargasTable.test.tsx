import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CargasTable from './CargasTable';
import { Cargo } from '../types/cargo.types';

function makeCargo(overrides: Partial<Cargo> = {}): Cargo {
  return {
    id: 'cargo-1',
    displayId: 12,
    freightId: 'freight-1',
    freightDisplayId: 7,
    freightRoute: 'Campinas x Santos',
    companyId: 'company-1',
    companyName: 'Atlas',
    cargoNumber: 'CG-2026-001',
    description: 'Carga seca paletizada',
    cargoType: 'Industrial',
    origin: 'Campinas/SP',
    destination: 'Santos/SP',
    status: 'planned',
    ...overrides,
  };
}

describe('CargasTable', () => {
  it('renderiza a lista e dispara editar/excluir', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <CargasTable
        cargas={[makeCargo()]}
        loading={false}
        canUpdate
        canDelete
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /Editar carga CG-2026-001/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Excluir carga CG-2026-001/i })[0]);

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'cargo-1' }));
    expect(onDelete).toHaveBeenCalledWith('cargo-1');
  });

  it('mostra estado vazio quando nao ha cargas', () => {
    render(
      <CargasTable
        cargas={[]}
        loading={false}
        canUpdate={false}
        canDelete={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/Nenhuma carga encontrada/i)).toBeInTheDocument();
  });
});
