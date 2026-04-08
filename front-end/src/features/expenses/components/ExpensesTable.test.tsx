import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import ExpensesTable from './ExpensesTable';

describe('ExpensesTable', () => {
  it('mostra estado de loading', () => {
    render(
      <ExpensesTable
        expenses={[]}
        loading
        canUpdate={false}
        canDelete={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(screen.getByText('Carregando custos operacionais...')).toBeInTheDocument();
  });

  it('mostra estado vazio', () => {
    render(
      <ExpensesTable
        expenses={[]}
        loading={false}
        canUpdate={false}
        canDelete={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(screen.getByText('Nenhum custo operacional encontrado.')).toBeInTheDocument();
  });

  it('renderiza linhas e dispara acoes acessiveis', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <ExpensesTable
        expenses={[
          {
            id: '1',
            date: '2026-04-08',
            time: '08:30',
            vehicleId: 'v1',
            vehicleName: 'Volvo',
            provider: 'Posto',
            category: 'Combustivel',
            quantity: '',
            amount: 100,
            odometer: '1000',
            status: 'approved',
            observations: '',
          },
        ]}
        loading={false}
        canUpdate
        canDelete
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('Volvo')).toBeInTheDocument();
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Editar custo de Volvo' }));
    await user.click(screen.getByRole('button', { name: 'Excluir custo de Volvo' }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
