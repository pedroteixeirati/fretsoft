import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { vehiclesApi } from '../../vehicles/services/vehicles.api';
import { providersApi } from '../../providers/services/providers.api';
import { expensesApi } from '../services/expenses.api';
import { queryKeys } from '../../../shared/lib/query-keys';

interface UseExpensesQueryOptions {
  enabled: boolean;
  canReadProviders: boolean;
}

export function useExpensesQuery({ enabled, canReadProviders }: UseExpensesQueryOptions) {
  const expensesQuery = useQuery({
    queryKey: queryKeys.expenses.list(),
    queryFn: expensesApi.list,
    enabled,
  });

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.list(),
    queryFn: vehiclesApi.list,
    enabled,
  });

  const providersQuery = useQuery({
    queryKey: queryKeys.providers.list(),
    queryFn: providersApi.list,
    enabled: enabled && canReadProviders,
  });

  const expenses = useMemo(() => {
    const items = expensesQuery.data ?? [];

    return [...items].sort((a, b) => {
      const left = `${a.date || ''}T${a.time || '00:00'}`;
      const right = `${b.date || ''}T${b.time || '00:00'}`;
      return right.localeCompare(left);
    });
  }, [expensesQuery.data]);

  return {
    expenses,
    vehicles: vehiclesQuery.data ?? [],
    providers: providersQuery.data ?? [],
    isLoading: expensesQuery.isLoading || vehiclesQuery.isLoading || (canReadProviders && providersQuery.isLoading),
    error: expensesQuery.error ?? vehiclesQuery.error ?? providersQuery.error ?? null,
    refetchAll: async () => {
      await Promise.all([
        expensesQuery.refetch(),
        vehiclesQuery.refetch(),
        canReadProviders ? providersQuery.refetch() : Promise.resolve(null),
      ]);
    },
  };
}
