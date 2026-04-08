import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createAppQueryClient } from '../../../shared/lib/query-client';
import { useExpensesQuery } from './useExpensesQuery';

const listExpenses = vi.fn();
const listVehicles = vi.fn();
const listProviders = vi.fn();

vi.mock('../services/expenses.api', () => ({
  expensesApi: { list: () => listExpenses() },
}));

vi.mock('../../vehicles/services/vehicles.api', () => ({
  vehiclesApi: { list: () => listVehicles() },
}));

vi.mock('../../providers/services/providers.api', () => ({
  providersApi: { list: () => listProviders() },
}));

function createWrapper() {
  const queryClient = createAppQueryClient();

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useExpensesQuery', () => {
  beforeEach(() => {
    listExpenses.mockReset();
    listVehicles.mockReset();
    listProviders.mockReset();
  });

  it('carrega e ordena custos por data e hora decrescente', async () => {
    listExpenses.mockResolvedValue([
      { id: '1', date: '2026-04-07', time: '08:00', amount: 10, vehicleId: 'v1', vehicleName: 'A', provider: 'P1', category: 'Combustivel', quantity: '', odometer: '', status: 'approved', observations: '' },
      { id: '2', date: '2026-04-08', time: '09:00', amount: 20, vehicleId: 'v2', vehicleName: 'B', provider: 'P2', category: 'Manutencao', quantity: '', odometer: '', status: 'approved', observations: '' },
    ]);
    listVehicles.mockResolvedValue([{ id: 'v1', name: 'Volvo', plate: 'ABC-1234' }]);
    listProviders.mockResolvedValue([{ id: 'p1', name: 'Oficina A' }]);

    const { result } = renderHook(
      () => useExpensesQuery({ enabled: true, canReadProviders: true }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.expenses.map((item) => item.id)).toEqual(['2', '1']);
    expect(result.current.vehicles).toHaveLength(1);
    expect(result.current.providers).toHaveLength(1);
  });

  it('não consulta fornecedores quando o perfil não pode ler fornecedores', async () => {
    listExpenses.mockResolvedValue([]);
    listVehicles.mockResolvedValue([]);

    const { result } = renderHook(
      () => useExpensesQuery({ enabled: true, canReadProviders: false }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(listProviders).not.toHaveBeenCalled();
    expect(result.current.providers).toEqual([]);
  });
});
