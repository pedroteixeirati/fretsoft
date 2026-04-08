import { renderHook, act } from '@testing-library/react';
import { useExpenseForm } from './useExpenseForm';

describe('useExpenseForm', () => {
  it('ordena fornecedores e inclui o fornecedor atual quando ele não está cadastrado', () => {
    const { result } = renderHook(() =>
      useExpenseForm({
        providers: [
          { id: '2', name: 'Zeta', type: '', status: '', contact: '', email: '', address: '' },
          { id: '1', name: 'Alpha', type: '', status: '', contact: '', email: '', address: '' },
        ],
      }),
    );

    act(() => {
      result.current.setFormData({ ...result.current.formData, provider: 'Fornecedor legado' });
    });

    expect(result.current.providerOptions.map((item) => item.label)).toEqual([
      'Fornecedor legado',
      'Alpha',
      'Zeta',
    ]);
  });

  it('abre criação resetando o formulário e abre edição preenchendo dados', () => {
    const { result } = renderHook(() => useExpenseForm({ providers: [] }));

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.isModalOpen).toBe(true);
    expect(result.current.editingExpense).toBeNull();

    act(() => {
      result.current.openEdit({
        id: '1',
        date: '2026-04-08',
        time: '09:30',
        vehicleId: 'v1',
        vehicleName: 'Volvo',
        provider: 'Posto',
        category: 'Combustivel',
        quantity: '10',
        amount: 100,
        odometer: '123',
        status: 'review',
        paymentRequired: true,
        dueDate: '2026-04-10',
        linkedPayableId: 'pay-1',
        observations: 'Obs',
      });
    });

    expect(result.current.editingExpense?.id).toBe('1');
    expect(result.current.formData.status).toBe('review');
    expect(result.current.formData.linkedPayableId).toBe('pay-1');

    act(() => {
      result.current.closeModal();
    });

    expect(result.current.isModalOpen).toBe(false);
    expect(result.current.editingExpense).toBeNull();
    expect(result.current.formData.provider).toBe('');
  });
});
