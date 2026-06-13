import { apiRequest, createCrudApi } from '../../../shared/lib/api-client';
import { OperationType } from '../../../firebase';
import { InventoryItem, InventoryMovement } from '../types/inventory.types';

const itemsCrud = createCrudApi<InventoryItem>('/api/inventory-items');

export interface InventoryMovementInput {
  inventoryItemId: string;
  movementType: 'in' | 'out';
  quantity: number;
  unitCost: number | null;
  occurredOn: string;
  reason: string;
  notes: string;
}

export const inventoryApi = {
  ...itemsCrud,
  listMovements: (itemId: string) =>
    apiRequest<InventoryMovement[]>(`/api/inventory-items/${itemId}/movements`, {}, OperationType.LIST),
  registerMovement: (payload: InventoryMovementInput) =>
    apiRequest<InventoryItem>(
      '/api/inventory-movements',
      { method: 'POST', body: JSON.stringify(payload) },
      OperationType.CREATE,
    ),
};
