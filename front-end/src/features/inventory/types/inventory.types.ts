export type InventoryMovementType = 'in' | 'out';

export interface InventoryItem {
  id: string;
  displayId?: number;
  code: string;
  name: string;
  category: string;
  unitCost: number;
  quantity: number;
  minQuantity: number | null;
  totalValue: number;
  belowMinimum: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  itemName: string;
  movementType: InventoryMovementType;
  quantity: number;
  unitCost: number | null;
  occurredOn: string;
  reason: string;
  serviceOrderId: string;
  notes: string;
  createdAt: string;
}

export const inventoryMovementTypeLabels: Record<InventoryMovementType, string> = {
  in: 'Entrada',
  out: 'Saida',
};
