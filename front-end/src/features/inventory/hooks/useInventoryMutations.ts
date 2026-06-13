import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../shared/lib/query-keys';
import { inventoryApi, InventoryMovementInput } from '../services/inventory.api';
import { InventoryItem } from '../types/inventory.types';

export type InventoryItemPayload = Pick<
  InventoryItem,
  'code' | 'name' | 'category' | 'unitCost' | 'minQuantity' | 'notes'
> & { quantity?: number };

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const invalidateInventory = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all });
  };

  const createItem = useMutation({
    mutationFn: (payload: InventoryItemPayload) => inventoryApi.create(payload as Omit<InventoryItem, 'id'>),
    onSuccess: invalidateInventory,
  });

  const updateItem = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InventoryItemPayload }) =>
      inventoryApi.update(id, payload),
    onSuccess: invalidateInventory,
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => inventoryApi.remove(id),
    onSuccess: invalidateInventory,
  });

  const registerMovement = useMutation({
    mutationFn: (payload: InventoryMovementInput) => inventoryApi.registerMovement(payload),
    onSuccess: invalidateInventory,
  });

  return {
    createItem,
    updateItem,
    deleteItem,
    registerMovement,
    isSubmitting: createItem.isPending || updateItem.isPending || deleteItem.isPending,
  };
}
