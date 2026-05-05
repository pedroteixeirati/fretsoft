import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, within } from '@testing-library/react';
import NovalogBillingFormModal from './NovalogBillingFormModal';

const companies = [
  {
    id: 'company-1',
    corporateName: 'Gerdau S/A',
    tradeName: 'Gerdau',
    cnpj: '00000000000000',
    stateRegistration: '',
    municipalRegistration: '',
    legalRepresentative: '',
    representativeCpf: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    status: 'active' as const,
  },
];

describe('NovalogBillingFormModal', () => {
  it('valida campos obrigatorios antes de salvar', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <NovalogBillingFormModal
        isOpen
        companies={companies}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.clear(screen.getByPlaceholderText('Numero CTe'));
    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));

    expect(screen.getByText('Revise os campos obrigatorios antes de salvar o faturamento.')).toBeInTheDocument();
    expect(screen.getByText('Selecione o cliente.')).toBeInTheDocument();
    expect(screen.getByText('Informe o CT-e.')).toBeInTheDocument();
    expect(screen.getByText('Informe um valor maior que zero.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('monta payload com cliente, vencimento e CT-es informados', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <NovalogBillingFormModal
        isOpen
        companies={companies}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByPlaceholderText('Selecione o cliente'));
    await user.click(screen.getByText('Gerdau'));
    await user.type(screen.getByPlaceholderText('Numero CTe'), '3521');
    await user.type(screen.getByPlaceholderText('0,00'), '123450');

    await user.click(screen.getByRole('button', { name: 'Salvar rascunho' }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: 'company-1',
        items: [
          expect.objectContaining({
            cteNumber: '3521',
            amount: 1234.5,
          }),
        ],
      }),
    );
  });

  it('preenche dados ao editar faturamento em rascunho', () => {
    render(
      <NovalogBillingFormModal
        isOpen
        companies={companies}
        draftBilling={{
          id: 'billing-1',
          displayId: 7,
          companyId: 'company-1',
          companyName: 'Gerdau',
          billingDate: '2026-04-10',
          dueDate: '2026-05-10',
          status: 'draft',
          notes: 'Faturamento Abril',
          cteCount: 1,
          totalAmount: 2000,
          receivedAmount: 0,
          openAmount: 2000,
          overdueAmount: 0,
          createdAt: '2026-04-10T00:00:00.000Z',
          items: [
            {
              id: 'item-1',
              billingId: 'billing-1',
              cteNumber: '8899',
              cteKey: '',
              issueDate: '2026-04-09',
              dueDate: '2026-05-15',
              originName: 'Mina',
              destinationName: 'Gerdau',
              amount: 2000,
              status: 'pending',
              notes: '',
              createdAt: '2026-04-10T00:00:00.000Z',
            },
          ],
        }}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText('Editar faturamento Novalog')).toBeInTheDocument();
    expect(screen.getByDisplayValue('8899')).toBeInTheDocument();
    expect(screen.getAllByText('Vencimento').length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue('Gerdau')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Faturamento Abril')).toBeInTheDocument();
    expect(within(screen.getByText('Total do faturamento').closest('section') as HTMLElement).getByText(/2.000,00/)).toBeInTheDocument();
  });
});
