import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '../../companies/services/companies.api';
import { vehiclesApi } from '../../vehicles/services/vehicles.api';
import { queryKeys } from '../../../shared/lib/query-keys';
import { payablesApi } from '../services/payables.api';

interface UsePayablesQueryOptions {
  enabled: boolean;
}

export function usePayablesQuery({ enabled }: UsePayablesQueryOptions) {
  const payablesQuery = useQuery({
    queryKey: queryKeys.payables.list(),
    queryFn: payablesApi.list,
    enabled,
  });

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.list(),
    queryFn: vehiclesApi.list,
    enabled,
  });

  const companiesQuery = useQuery({
    queryKey: queryKeys.companies.list(),
    queryFn: companiesApi.list,
    enabled,
  });

  return {
    payables: payablesQuery.data ?? [],
    vehicles: vehiclesQuery.data ?? [],
    companies: companiesQuery.data ?? [],
    isLoading: payablesQuery.isLoading || vehiclesQuery.isLoading || companiesQuery.isLoading,
    error: payablesQuery.error ?? vehiclesQuery.error ?? companiesQuery.error ?? null,
    refetchAll: async () => {
      await Promise.all([
        payablesQuery.refetch(),
        vehiclesQuery.refetch(),
        companiesQuery.refetch(),
      ]);
    },
  };
}
