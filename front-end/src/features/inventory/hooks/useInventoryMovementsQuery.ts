import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { inventoryApi } from '../services/inventory.api';

export function useInventoryMovementsQuery(itemId: string | null) {
  const movementsQuery = useQuery({
    queryKey: queryKeys.inventory.movements(itemId || 'none'),
    queryFn: () => inventoryApi.listMovements(itemId as string),
    enabled: Boolean(itemId),
  });

  return {
    movements: movementsQuery.data ?? [],
    isLoading: movementsQuery.isLoading,
    error: movementsQuery.error ?? null,
  };
}
