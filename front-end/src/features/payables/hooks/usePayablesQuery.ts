import { useQuery } from '@tanstack/react-query';
import { companiesApi } from '../../companies/services/companies.api';
import { providersApi } from '../../providers/services/providers.api';
import { vehiclesApi } from '../../vehicles/services/vehicles.api';
import { queryKeys } from '../../../shared/lib/query-keys';
import { payablesApi } from '../services/payables.api';

interface UsePayablesQueryOptions {
  enabled: boolean;
  canReadProviders?: boolean;
}

export function usePayablesQuery({ enabled, canReadProviders = false }: UsePayablesQueryOptions) {
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

  const providersQuery = useQuery({
    queryKey: queryKeys.providers.list(),
    queryFn: providersApi.list,
    enabled: enabled && canReadProviders,
  });

  return {
    payables: payablesQuery.data ?? [],
    vehicles: vehiclesQuery.data ?? [],
    companies: companiesQuery.data ?? [],
    providers: providersQuery.data ?? [],
    isLoading: payablesQuery.isLoading || vehiclesQuery.isLoading || companiesQuery.isLoading || (canReadProviders && providersQuery.isLoading),
    error: payablesQuery.error ?? vehiclesQuery.error ?? companiesQuery.error ?? providersQuery.error ?? null,
    refetchAll: async () => {
      await Promise.all([
        payablesQuery.refetch(),
        vehiclesQuery.refetch(),
        companiesQuery.refetch(),
        canReadProviders ? providersQuery.refetch() : Promise.resolve(null),
      ]);
    },
  };
}
