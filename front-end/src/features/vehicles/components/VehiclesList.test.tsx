import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import VehiclesList from './VehiclesList';
import { Vehicle } from '../types/vehicle.types';

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'vehicle-1',
    tenantId: 'tenant-1',
    name: 'Volvo FH 550',
    plate: 'ABC-1234',
    driver: 'Leonardo',
    type: 'Carga Pesada',
    km: 120000,
    nextMaintenance: '2026-04-30',
    status: 'active',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('VehiclesList', () => {
  it('renderiza a lista e dispara editar/excluir', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <VehiclesList
        vehicles={[makeVehicle()]}
        loading={false}
        canUpdate
        canDelete
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Editar veiculo Volvo FH 550/i }));
    fireEvent.click(screen.getByRole('button', { name: /Excluir veiculo Volvo FH 550/i }));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'vehicle-1' }));
    expect(onDelete).toHaveBeenCalledWith('vehicle-1');
  });

  it('mostra estado vazio quando nao ha veiculos', () => {
    render(
      <VehiclesList
        vehicles={[]}
        loading={false}
        canUpdate={false}
        canDelete={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(/Nenhum veiculo encontrado/i)).toBeInTheDocument();
    expect(screen.getByText(/Comece adicionando seu primeiro veiculo/i)).toBeInTheDocument();
  });
});
