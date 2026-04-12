import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PayablesTable from './PayablesTable';
import { Payable } from '../types/payable.types';

function makePayable(overrides: Partial<Payable> = {}): Payable {
  return {
    id: 'payable-1',
    tenantId: 'tenant-1',
    sourceType: 'manual',
    sourceId: undefined,
    vehicleId: undefined,
    contractId: undefined,
    providerName: 'Posto Ipiranga',
    description: 'Abastecimento',
    amount: 20000,
    dueDate: '2026-04-07',
    status: 'open',
    paidAt: undefined,
    paymentMethod: undefined,
    proofUrl: undefined,
    notes: undefined,
    vehicleName: 'volvo fh 550',
    createdAt: '2026-04-01T10:00:00.000Z',
    updatedAt: '2026-04-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('PayablesTable', () => {
  it('renderiza linha e dispara as acoes principais', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onPay = vi.fn();
    const onMarkOverdue = vi.fn();

    render(
      <PayablesTable
        payables={[makePayable()]}
        loading={false}
        processingId={null}
        currentPage={1}
        totalPages={2}
        canUpdate
        canDelete
        onEdit={onEdit}
        onDelete={onDelete}
        onPay={onPay}
        onMarkOverdue={onMarkOverdue}
        onPreviousPage={vi.fn()}
        onNextPage={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Pagar' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Em atraso' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Excluir' })[0]);

    expect(onPay).toHaveBeenCalledWith('payable-1');
    expect(onMarkOverdue).toHaveBeenCalledWith('payable-1');
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'payable-1' }));
    expect(onDelete).toHaveBeenCalledWith('payable-1');
  });

  it('mostra estado vazio e permite navegar na paginacao', () => {
    const onPreviousPage = vi.fn();
    const onNextPage = vi.fn();

    render(
      <PayablesTable
        payables={[]}
        loading={false}
        processingId={null}
        currentPage={2}
        totalPages={3}
        canUpdate={false}
        canDelete={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onPay={vi.fn()}
        onMarkOverdue={vi.fn()}
        onPreviousPage={onPreviousPage}
        onNextPage={onNextPage}
      />,
    );

    expect(screen.getByText(/Nenhuma conta a pagar encontrada/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pagina anterior/i }));
    fireEvent.click(screen.getByRole('button', { name: /Proxima pagina/i }));

    expect(onPreviousPage).toHaveBeenCalledTimes(1);
    expect(onNextPage).toHaveBeenCalledTimes(1);
  });
});
