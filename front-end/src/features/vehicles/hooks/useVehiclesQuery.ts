import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { vehiclesApi } from '../services/vehicles.api';

interface UseVehiclesQueryOptions {
  enabled: boolean;
}

export function useVehiclesQuery({ enabled }: UseVehiclesQueryOptions) {
  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles.list(),
    queryFn: vehiclesApi.list,
    enabled,
  });

  const vehicles = useMemo(() => vehiclesQuery.data ?? [], [vehiclesQuery.data]);

  return {
    vehicles,
    isLoading: vehiclesQuery.isLoading,
    error: vehiclesQuery.error ?? null,
    refetch: vehiclesQuery.refetch,
  };
}
