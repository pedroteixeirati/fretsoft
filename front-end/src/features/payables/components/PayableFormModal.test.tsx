import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PayableFormModal from './PayableFormModal';
import { defaultPayableFormData } from '../hooks/usePayableForm';

vi.mock('../../../components/Modal', () => ({
  default: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: React.ReactNode }) =>
    isOpen ? (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    ) : null,
}));

describe('PayableFormModal', () => {
  it('usa autocomplete de fornecedor no modo NovaLog com as opcoes recebidas', () => {
    render(
      <PayableFormModal
        isOpen
        editing={false}
        submitError=""
        fieldErrors={{}}
        formData={defaultPayableFormData()}
        isSubmitting={false}
        vehicles={[]}
        companies={[]}
        providerOptions={[{ value: 'POSTO CENTRAL', label: 'POSTO CENTRAL' }]}
        showNovalogFields
        onClose={() => undefined}
        onSubmit={(event) => event.preventDefault()}
        onChange={() => undefined}
        onClearFieldError={() => undefined}
      />,
    );

    const providerInput = screen.getByPlaceholderText('Selecione o fornecedor');
    fireEvent.focus(providerInput);

    expect(screen.getByText('POSTO CENTRAL')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Ex: Oficina Diesel Centro')).not.toBeInTheDocument();
  });
});
