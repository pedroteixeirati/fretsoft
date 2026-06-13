import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { serviceOrdersApi } from '../services/service-orders.api';

interface UseServiceOrdersQueryOptions {
  enabled: boolean;
}

export function useServiceOrdersQuery({ enabled }: UseServiceOrdersQueryOptions) {
  const serviceOrdersQuery = useQuery({
    queryKey: queryKeys.serviceOrders.list(),
    queryFn: serviceOrdersApi.list,
    enabled,
  });

  const serviceOrders = useMemo(() => serviceOrdersQuery.data ?? [], [serviceOrdersQuery.data]);

  return {
    serviceOrders,
    isLoading: serviceOrdersQuery.isLoading,
    error: serviceOrdersQuery.error ?? null,
    refetch: serviceOrdersQuery.refetch,
  };
}
