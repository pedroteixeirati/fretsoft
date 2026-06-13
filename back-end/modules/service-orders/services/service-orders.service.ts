import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidDate, isValidUuid, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  deleteTenantServiceOrder,
  findTenantServiceOrder,
  findVehicleBelongsToTenant,
  InsufficientInventoryError,
  insertTenantServiceOrder,
  listTenantServiceOrders,
  updateTenantServiceOrder,
  type ServiceOrderItemRow,
  type ServiceOrderRow,
} from '../repositories/service-orders.repository';

export const serviceOrderPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

const statuses = ['open', 'in_progress', 'completed', 'canceled'];
const itemTypes = ['part', 'labor'];

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function mapItemRow(row: ServiceOrderItemRow) {
  return {
    id: row.id,
    itemType: row.item_type,
    description: row.description,
    quantity: Number(row.quantity || 0),
    unitAmount: Number(row.unit_amount || 0),
    totalAmount: Number(row.total_amount || 0),
    supplierName: row.supplier_name || '',
    inventoryItemId: row.inventory_item_id || '',
    inventoryItemName: row.inventory_item_name || '',
    notes: row.notes || '',
  };
}

export function mapServiceOrderRow(row: ServiceOrderRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name || '',
    vehiclePlate: row.vehicle_plate || '',
    status: row.status,
    openedOn: row.opened_on,
    closedOn: row.closed_on || '',
    odometer: row.odometer !== null && row.odometer !== undefined ? Number(row.odometer) : null,
    providerName: row.provider_name || '',
    description: row.description,
    totalAmount: Number(row.total_amount || 0),
    notes: row.notes || '',
    items: Array.isArray(row.items) ? row.items.map(mapItemRow) : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw validationError('Inclua ao menos um item (peca ou mao de obra) na ordem de servico.', 'invalid_service_order_items', 'items');
  }

  return rawItems.map((raw, index) => {
    const item = (raw || {}) as Record<string, unknown>;
    const itemType = normalizeOptionalText(item.itemType as string) || 'part';
    const description = normalizeRequiredText(item.description as string);
    const quantity = Number(item.quantity);
    const unitAmount = Number(item.unitAmount);
    const inventoryItemId = normalizeOptionalText(item.inventoryItemId as string);

    if (!itemTypes.includes(itemType)) {
      throw validationError(`Informe um tipo valido para o item ${index + 1}.`, 'invalid_service_order_item_type', 'items');
    }
    if (description.length < 2) {
      throw validationError(`Informe a descricao do item ${index + 1}.`, 'invalid_service_order_item_description', 'items');
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw validationError(`A quantidade do item ${index + 1} deve ser maior que zero.`, 'invalid_service_order_item_quantity', 'items');
    }
    if (!Number.isFinite(unitAmount) || unitAmount < 0) {
      throw validationError(`O valor unitario do item ${index + 1} deve ser zero ou maior.`, 'invalid_service_order_item_unit_amount', 'items');
    }
    if (inventoryItemId && !isValidUuid(inventoryItemId)) {
      throw validationError(`Vinculo de peca invalido no item ${index + 1}.`, 'invalid_service_order_item_inventory', 'items');
    }

    return {
      itemType: itemType as 'part' | 'labor',
      description,
      quantity: round(quantity),
      unitAmount: round(unitAmount),
      totalAmount: round(quantity * unitAmount),
      supplierName: normalizeOptionalText(item.supplierName as string),
      inventoryItemId: itemType === 'part' ? inventoryItemId : null,
      notes: normalizeOptionalText(item.notes as string),
    };
  });
}

async function validateServiceOrderPayload(body: Record<string, unknown>, tenantId?: string) {
  const vehicleId = normalizeOptionalText(body.vehicleId as string) || '';
  const status = normalizeOptionalText(body.status as string) || 'open';
  const openedOn = normalizeOptionalText(body.openedOn as string) || '';
  const closedOn = normalizeOptionalText(body.closedOn as string);
  const providerName = normalizeOptionalText(body.providerName as string);
  const description = normalizeRequiredText(body.description as string);
  const notes = normalizeOptionalText(body.notes as string);

  if (!isValidUuid(vehicleId)) {
    throw validationError('Selecione o veiculo da ordem de servico.', 'invalid_service_order_vehicle', 'vehicleId');
  }
  if (!statuses.includes(status)) {
    throw validationError('Informe um status valido para a ordem de servico.', 'invalid_service_order_status', 'status');
  }
  if (!isValidDate(openedOn)) {
    throw validationError('Informe a data de abertura da ordem de servico.', 'invalid_service_order_opened_on', 'openedOn');
  }
  if (closedOn && !isValidDate(closedOn)) {
    throw validationError('Informe uma data de conclusao valida.', 'invalid_service_order_closed_on', 'closedOn');
  }
  if (closedOn && closedOn < openedOn) {
    throw validationError('A conclusao deve ser posterior a abertura.', 'invalid_service_order_period', 'closedOn');
  }
  if (description.length < 3) {
    throw validationError('Descreva o servico realizado.', 'invalid_service_order_description', 'description');
  }

  let odometer: number | null = null;
  if (body.odometer !== undefined && body.odometer !== null && String(body.odometer).trim() !== '') {
    const numericOdometer = Number(body.odometer);
    if (!Number.isFinite(numericOdometer) || numericOdometer < 0) {
      throw validationError('A quilometragem deve ser zero ou maior.', 'invalid_service_order_odometer', 'odometer');
    }
    odometer = round(numericOdometer);
  }

  const items = validateItems(body.items);
  const totalAmount = round(items.reduce((sum, item) => sum + item.totalAmount, 0));

  const vehicle = await findVehicleBelongsToTenant(vehicleId, tenantId);
  if (!vehicle) {
    throw validationError('Veiculo nao encontrado para esta transportadora.', 'invalid_service_order_vehicle', 'vehicleId');
  }

  return {
    vehicleId,
    status,
    openedOn,
    closedOn: closedOn || null,
    odometer,
    providerName,
    description,
    totalAmount,
    notes,
    items,
  };
}

export async function listServiceOrders(auth?: AuthContext) {
  const rows = await listTenantServiceOrders(auth?.tenantId);
  return rows.map(mapServiceOrderRow);
}

export async function getServiceOrder(auth: AuthContext | undefined, id: string) {
  const row = await findTenantServiceOrder(id, auth?.tenantId);
  return row ? mapServiceOrderRow(row) : null;
}

function rethrowInventoryError(error: unknown): never {
  if (error instanceof InsufficientInventoryError) {
    throw validationError(error.message, 'service_order_insufficient_inventory', 'items');
  }
  throw error;
}

export async function createServiceOrder(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = await validateServiceOrderPayload(body, auth?.tenantId);
  try {
    const row = await insertTenantServiceOrder(payload, auth?.tenantId, auth?.userId);
    return row ? mapServiceOrderRow(row) : null;
  } catch (error) {
    rethrowInventoryError(error);
  }
}

export async function updateServiceOrder(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = await validateServiceOrderPayload(body, auth?.tenantId);
  try {
    const row = await updateTenantServiceOrder(id, payload, auth?.tenantId, auth?.userId);
    return row ? mapServiceOrderRow(row) : undefined;
  } catch (error) {
    rethrowInventoryError(error);
  }
}

export async function deleteServiceOrder(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantServiceOrder(id, auth?.tenantId);
  return Boolean(row);
}
