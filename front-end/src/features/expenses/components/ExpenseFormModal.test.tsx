import React from 'react';
import { render, screen } from '@testing-library/react';
import ExpenseFormModal from './ExpenseFormModal';
import { ExpenseFormData } from '../hooks/useExpenseForm';

vi.mock('../../../components/Modal', () => ({
  default: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) =>
    isOpen ? (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}));

vi.mock('../../../components/CustomSelect', () => ({
  default: ({ value, onChange, options, placeholder, disabled }: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
    disabled?: boolean;
  }) => (
    <select
      aria-label={placeholder || 'select'}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder || 'Selecione'}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  ),
}));

function makeFormData(overrides: Partial<ExpenseFormData> = {}): ExpenseFormData {
  return {
    date: '2026-04-08',
    time: '08:00',
    vehicleId: 'v1',
    vehicleName: 'Volvo',
    provider: 'Posto',
    category: 'Combustivel',
    quantity: '',
    amount: 100,
    odometer: '',
    status: 'approved',
    paymentRequired: false,
    dueDate: '',
    linkedPayableId: null,
    observations: '',
    ...overrides,
  };
}

describe('ExpenseFormModal', () => {
  it('renderiza mensagem de erro e aviso financeiro quando aplicável', () => {
    render(
      <ExpenseFormModal
        isOpen
        editing
        submitError="Erro ao salvar"
        formData={makeFormData({ paymentRequired: true, dueDate: '2026-04-10', linkedPayableId: 'pay-1' })}
        isSubmitting={false}
        canReadProviders
        vehicles={[{ id: 'v1', name: 'Volvo', plate: 'ABC-1234' }]}
        providers={[]}
        providerOptions={[{ value: 'Posto', label: 'Posto' }]}
        onClose={() => undefined}
        onSubmit={(event) => event.preventDefault()}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByText('Editar custo operacional')).toBeInTheDocument();
    expect(screen.getByText('Erro ao salvar')).toBeInTheDocument();
    expect(screen.getByText('Este custo possui uma conta a pagar vinculada.')).toBeInTheDocument();
    expect(screen.getByText('Este custo sera enviado para Contas a pagar ao salvar.')).toBeInTheDocument();
  });

  it('desabilita seleção de fornecedor quando não há permissão', () => {
    render(
      <ExpenseFormModal
        isOpen
        editing={false}
        submitError=""
        formData={makeFormData()}
        isSubmitting={false}
        canReadProviders={false}
        vehicles={[{ id: 'v1', name: 'Volvo', plate: 'ABC-1234' }]}
        providers={[]}
        providerOptions={[]}
        onClose={() => undefined}
        onSubmit={(event) => event.preventDefault()}
        onChange={() => undefined}
      />,
    );

    expect(screen.getByRole('combobox', { name: 'Sem acesso aos fornecedores' })).toBeDisabled();
  });
});
