import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useExpenseMutations } from './useExpenseMutations';

const createExpenseApi = vi.fn();
const updateExpenseApi = vi.fn();
const removeExpenseApi = vi.fn();

vi.mock('../services/expenses.api', () => ({
  expensesApi: {
    create: (...args: unknown[]) => createExpenseApi(...args),
    update: (...args: unknown[]) => updateExpenseApi(...args),
    remove: (...args: unknown[]) => removeExpenseApi(...args),
  },
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useExpenseMutations', () => {
  beforeEach(() => {
    createExpenseApi.mockReset();
    updateExpenseApi.mockReset();
    removeExpenseApi.mockReset();
  });

  it('cria custo e invalida a query de expenses', async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    createExpenseApi.mockResolvedValue({ id: '1' });

    const { result } = renderHook(() => useExpenseMutations(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.createExpense.mutateAsync({
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
      observations: '',
    });

    await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());
    expect(createExpenseApi).toHaveBeenCalledTimes(1);
  });

  it('atualiza e exclui custo usando a api correta', async () => {
    const queryClient = new QueryClient();
    updateExpenseApi.mockResolvedValue({ id: '1' });
    removeExpenseApi.mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpenseMutations(), {
      wrapper: createWrapper(queryClient),
    });

    await result.current.updateExpense.mutateAsync({
      id: '1',
      payload: { provider: 'Fornecedor novo' },
    });
    await result.current.deleteExpense.mutateAsync('1');

    expect(updateExpenseApi).toHaveBeenCalledWith('1', { provider: 'Fornecedor novo' });
    expect(removeExpenseApi).toHaveBeenCalledWith('1');
  });
});
