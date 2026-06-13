import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { inventoryApi } from '../services/inventory.api';

interface UseInventoryQueryOptions {
  enabled: boolean;
}

export function useInventoryQuery({ enabled }: UseInventoryQueryOptions) {
  const itemsQuery = useQuery({
    queryKey: queryKeys.inventory.list(),
    queryFn: inventoryApi.list,
    enabled,
  });

  const items = useMemo(() => itemsQuery.data ?? [], [itemsQuery.data]);

  return {
    items,
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error ?? null,
    refetch: itemsQuery.refetch,
  };
}
