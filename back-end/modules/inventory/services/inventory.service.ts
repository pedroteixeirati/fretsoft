import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidDate, isValidUuid, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  deleteTenantInventoryItem,
  findTenantInventoryItem,
  insertTenantInventoryItem,
  listInventoryMovements,
  listTenantInventoryItems,
  registerInventoryMovement,
  updateTenantInventoryItem,
  type InventoryItemRow,
  type InventoryMovementRow,
} from '../repositories/inventory.repository';

export const inventoryPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function mapInventoryItemRow(row: InventoryItemRow) {
  const quantity = Number(row.quantity || 0);
  const unitCost = Number(row.unit_cost || 0);
  const minQuantity = row.min_quantity !== null && row.min_quantity !== undefined ? Number(row.min_quantity) : null;
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    code: row.code || '',
    name: row.name,
    category: row.category || '',
    unitCost,
    quantity,
    minQuantity,
    totalValue: round(quantity * unitCost),
    belowMinimum: minQuantity !== null && quantity <= minQuantity,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapInventoryMovementRow(row: InventoryMovementRow) {
  return {
    id: row.id,
    inventoryItemId: row.inventory_item_id,
    itemName: row.item_name || '',
    movementType: row.movement_type,
    quantity: Number(row.quantity || 0),
    unitCost: row.unit_cost !== null && row.unit_cost !== undefined ? Number(row.unit_cost) : null,
    occurredOn: row.occurred_on,
    reason: row.reason || '',
    serviceOrderId: row.service_order_id || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function validateItemPayload(body: Record<string, unknown>, requireInitialQuantity: boolean) {
  const code = normalizeOptionalText(body.code as string);
  const name = normalizeRequiredText(body.name as string);
  const category = normalizeOptionalText(body.category as string);
  const notes = normalizeOptionalText(body.notes as string);

  if (name.length < 2) {
    throw validationError('Informe o nome da peca.', 'invalid_inventory_item_name', 'name');
  }

  const unitCostValue = Number(body.unitCost);
  if (!Number.isFinite(unitCostValue) || unitCostValue < 0) {
    throw validationError('O valor unitario deve ser zero ou maior.', 'invalid_inventory_item_unit_cost', 'unitCost');
  }

  let minQuantity: number | null = null;
  if (body.minQuantity !== undefined && body.minQuantity !== null && String(body.minQuantity).trim() !== '') {
    const numericMin = Number(body.minQuantity);
    if (!Number.isFinite(numericMin) || numericMin < 0) {
      throw validationError('O estoque minimo deve ser zero ou maior.', 'invalid_inventory_item_min_quantity', 'minQuantity');
    }
    minQuantity = round(numericMin);
  }

  const payload: Record<string, unknown> = {
    code,
    name,
    category,
    unitCost: round(unitCostValue),
    minQuantity,
    notes,
  };

  if (requireInitialQuantity) {
    let quantity = 0;
    if (body.quantity !== undefined && body.quantity !== null && String(body.quantity).trim() !== '') {
      const numericQuantity = Number(body.quantity);
      if (!Number.isFinite(numericQuantity) || numericQuantity < 0) {
        throw validationError('O saldo inicial deve ser zero ou maior.', 'invalid_inventory_item_quantity', 'quantity');
      }
      quantity = round(numericQuantity);
    }
    payload.quantity = quantity;
  }

  return payload;
}

export async function listInventoryItems(auth?: AuthContext) {
  const rows = await listTenantInventoryItems(auth?.tenantId);
  return rows.map(mapInventoryItemRow);
}

export async function getInventoryItemMovements(auth: AuthContext | undefined, itemId: string) {
  const item = await findTenantInventoryItem(itemId, auth?.tenantId);
  if (!item) return null;
  const rows = await listInventoryMovements(itemId, auth?.tenantId);
  return rows.map(mapInventoryMovementRow);
}

export async function createInventoryItem(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = validateItemPayload(body, true);
  const row = await insertTenantInventoryItem(payload, auth?.tenantId, auth?.userId);
  return row ? mapInventoryItemRow(row) : null;
}

export async function updateInventoryItem(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = validateItemPayload(body, false);
  const row = await updateTenantInventoryItem(id, payload, auth?.tenantId, auth?.userId);
  return row ? mapInventoryItemRow(row) : undefined;
}

export async function deleteInventoryItem(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantInventoryItem(id, auth?.tenantId);
  return Boolean(row);
}

export async function createInventoryMovement(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const inventoryItemId = normalizeOptionalText(body.inventoryItemId as string) || '';
  const movementType = normalizeOptionalText(body.movementType as string) || 'in';
  const occurredOn = normalizeOptionalText(body.occurredOn as string) || '';
  const reason = normalizeOptionalText(body.reason as string);
  const serviceOrderId = normalizeOptionalText(body.serviceOrderId as string);
  const notes = normalizeOptionalText(body.notes as string);

  if (!isValidUuid(inventoryItemId)) {
    throw validationError('Selecione a peca da movimentacao.', 'invalid_inventory_movement_item', 'inventoryItemId');
  }
  if (movementType !== 'in' && movementType !== 'out') {
    throw validationError('Informe um tipo de movimentacao valido.', 'invalid_inventory_movement_type', 'movementType');
  }
  if (!isValidDate(occurredOn)) {
    throw validationError('Informe a data da movimentacao.', 'invalid_inventory_movement_date', 'occurredOn');
  }

  const quantity = Number(body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw validationError('A quantidade deve ser maior que zero.', 'invalid_inventory_movement_quantity', 'quantity');
  }

  let unitCost: number | null = null;
  if (body.unitCost !== undefined && body.unitCost !== null && String(body.unitCost).trim() !== '') {
    const numericCost = Number(body.unitCost);
    if (!Number.isFinite(numericCost) || numericCost < 0) {
      throw validationError('O valor unitario deve ser zero ou maior.', 'invalid_inventory_movement_unit_cost', 'unitCost');
    }
    unitCost = round(numericCost);
  }

  if (serviceOrderId && !isValidUuid(serviceOrderId)) {
    throw validationError('Vinculo de ordem de servico invalido.', 'invalid_inventory_movement_service_order', 'serviceOrderId');
  }

  const result = await registerInventoryMovement(
    {
      inventoryItemId,
      movementType,
      quantity: round(quantity),
      unitCost,
      occurredOn,
      reason,
      serviceOrderId: serviceOrderId || null,
      notes,
    },
    auth?.tenantId,
    auth?.userId,
  );

  if (result.status === 'not_found') {
    return { status: 'not_found' as const };
  }
  if (result.status === 'insufficient') {
    throw validationError(
      `Saldo insuficiente para a saida. Disponivel: ${result.available}.`,
      'inventory_movement_insufficient_balance',
      'quantity',
    );
  }

  return { status: 'ok' as const, item: result.item ? mapInventoryItemRow(result.item) : null };
}
