import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import NovalogBillingDetailsModal from './NovalogBillingDetailsModal';
import { NovalogBilling } from '../types/novalog-billing.types';

function makeBilling(overrides: Partial<NovalogBilling> = {}): NovalogBilling {
  return {
    id: 'billing-1',
    displayId: 12,
    companyId: 'company-1',
    companyName: 'Gerdau',
    billingDate: '2026-04-10',
    dueDate: '2026-05-10',
    status: 'open',
    notes: '',
    cteCount: 2,
    totalAmount: 5000,
    receivedAmount: 2000,
    openAmount: 3000,
    overdueAmount: 0,
    createdAt: '2026-04-10T00:00:00.000Z',
    items: [
      {
        id: 'item-1',
        billingId: 'billing-1',
        cteNumber: '1001',
        cteKey: '',
        issueDate: '2026-04-01',
        dueDate: '2026-05-10',
        originName: 'Mina X',
        destinationName: 'Gerdau',
        amount: 2000,
        status: 'received',
        receivedAt: '2026-04-12T00:00:00.000Z',
        notes: '',
        linkedRevenueId: 'revenue-1',
        createdAt: '2026-04-10T00:00:00.000Z',
      },
      {
        id: 'item-2',
        billingId: 'billing-1',
        cteNumber: '1002',
        cteKey: '',
        issueDate: '2026-04-02',
        dueDate: '2026-05-20',
        originName: 'Mina Y',
        destinationName: 'Gerdau',
        amount: 3000,
        status: 'pending',
        notes: '',
        linkedRevenueId: 'revenue-2',
        createdAt: '2026-04-10T00:00:00.000Z',
      },
    ],
    ...overrides,
  };
}

describe('NovalogBillingDetailsModal', () => {
  it('renderiza totais e dispara baixa individual por CT-e', async () => {
    const user = userEvent.setup();
    const onReceiveItem = vi.fn();
    const onOverdueItem = vi.fn();
    const onEditItem = vi.fn();
    const onDeleteItem = vi.fn();
    const onOpenRevenue = vi.fn();

    render(
      <NovalogBillingDetailsModal
        isOpen
        billing={makeBilling()}
        onClose={vi.fn()}
        onCloseBilling={vi.fn()}
        onEdit={vi.fn()}
        onReceiveItem={onReceiveItem}
        onOverdueItem={onOverdueItem}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onOpenRevenue={onOpenRevenue}
      />,
    );

    expect(screen.getByText('Faturamento #12')).toBeInTheDocument();
    expect(screen.getByText('Gerdau')).toBeInTheDocument();
    expect(screen.getByText('1001')).toBeInTheDocument();
    expect(screen.getByText('1002')).toBeInTheDocument();
    expect(screen.getByText('Recebimento')).toBeInTheDocument();
    expect(screen.getAllByText('Vencimento').length).toBeGreaterThan(0);
    expect(screen.getByText('20/05/2026')).toBeInTheDocument();
    expect(screen.getByText('12/04/2026')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Recebida' }));
    await user.click(screen.getByRole('button', { name: 'Acoes do CT-e 1002' }));
    await user.click(screen.getByRole('button', { name: 'Em atraso' }));
    await user.click(screen.getByRole('button', { name: 'Acoes do CT-e 1002' }));
    await user.click(screen.getByRole('button', { name: 'Editar' }));
    await user.click(screen.getByRole('button', { name: 'Acoes do CT-e 1002' }));
    await user.click(screen.getByRole('button', { name: 'Excluir' }));
    await user.click(screen.getByRole('button', { name: 'Acoes do CT-e 1001' }));
    await user.click(screen.getByRole('button', { name: 'Recebivel' }));

    expect(onReceiveItem).toHaveBeenCalledWith('item-2');
    expect(onOverdueItem).toHaveBeenCalledWith('item-2');
    expect(onEditItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-2' }));
    expect(onDeleteItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-2' }));
    expect(onOpenRevenue).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1', linkedRevenueId: 'revenue-1' }));
  });

  it('bloqueia baixa de CT-es enquanto faturamento esta em rascunho', () => {
    render(
      <NovalogBillingDetailsModal
        isOpen
        billing={makeBilling({ status: 'draft' })}
        onClose={vi.fn()}
        onCloseBilling={vi.fn()}
        onEdit={vi.fn()}
        onReceiveItem={vi.fn()}
        onOverdueItem={vi.fn()}
        onEditItem={vi.fn()}
        onDeleteItem={vi.fn()}
      />,
    );

    expect(screen.queryByText('Feche para baixar')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Recebida' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar e gerar recebiveis' })).toBeInTheDocument();
  });

  it('permite editar apenas quando o faturamento em rascunho tem detalhes carregados', () => {
    const onEdit = vi.fn();

    render(
      <NovalogBillingDetailsModal
        isOpen
        billing={makeBilling({ status: 'draft', items: undefined })}
        onClose={vi.fn()}
        onCloseBilling={vi.fn()}
        onEdit={onEdit}
        onReceiveItem={vi.fn()}
        onOverdueItem={vi.fn()}
        onEditItem={vi.fn()}
        onDeleteItem={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Editar' })).toBeDisabled();
  });

  it('nao permite editar ou excluir CT-e recebida', () => {
    render(
      <NovalogBillingDetailsModal
        isOpen
        billing={makeBilling({
          items: [
            {
              id: 'item-received',
              billingId: 'billing-1',
              cteNumber: '1001',
              cteKey: '',
              issueDate: '2026-04-01',
              dueDate: '2026-05-10',
              originName: '',
              destinationName: '',
              amount: 2000,
              status: 'received',
              receivedAt: '2026-04-12T00:00:00.000Z',
              notes: '',
              linkedRevenueId: 'revenue-1',
              createdAt: '2026-04-10T00:00:00.000Z',
            },
          ],
        })}
        onClose={vi.fn()}
        onCloseBilling={vi.fn()}
        onEdit={vi.fn()}
        onReceiveItem={vi.fn()}
        onOverdueItem={vi.fn()}
        onEditItem={vi.fn()}
        onDeleteItem={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });
});
