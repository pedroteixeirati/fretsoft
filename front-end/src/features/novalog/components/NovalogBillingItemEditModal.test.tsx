import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import NovalogBillingItemEditModal from './NovalogBillingItemEditModal';
import { NovalogBillingItem } from '../types/novalog-billing.types';

const item: NovalogBillingItem = {
  id: 'item-1',
  billingId: 'billing-1',
  cteNumber: '9614',
  cteKey: '',
  issueDate: '2026-04-01',
  originName: '',
  destinationName: '',
  amount: 1687.7,
  status: 'pending',
  notes: '',
  linkedRevenueId: 'revenue-1',
  createdAt: '2026-04-10T00:00:00.000Z',
};

describe('NovalogBillingItemEditModal', () => {
  it('valida campos obrigatorios antes de salvar CT-e', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <NovalogBillingItemEditModal
        isOpen
        item={item}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByPlaceholderText('Numero CT-e'));
    await user.clear(screen.getByPlaceholderText('0,00'));
    await user.click(screen.getByRole('button', { name: 'Salvar CT-e' }));

    expect(screen.getByText('Informe CT-e e valor maior que zero.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('monta payload de atualizacao do CT-e', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <NovalogBillingItemEditModal
        isOpen
        item={item}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByPlaceholderText('Numero CT-e'));
    await user.type(screen.getByPlaceholderText('Numero CT-e'), '9634');
    await user.clear(screen.getByPlaceholderText('0,00'));
    await user.type(screen.getByPlaceholderText('0,00'), '236149');
    await user.click(screen.getByRole('button', { name: 'Salvar CT-e' }));

    expect(onSubmit).toHaveBeenCalledWith('item-1', expect.objectContaining({
      cteNumber: '9634',
      amount: 2361.49,
      issueDate: '2026-04-01',
    }));
  });
});
