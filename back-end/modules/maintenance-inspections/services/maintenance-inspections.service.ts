import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidDate, isValidUuid, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  deleteTenantInspection,
  findTenantInspection,
  findVehicleBelongsToTenant,
  insertTenantInspection,
  listTenantInspections,
  updateTenantInspection,
  type MaintenanceInspectionItemRow,
  type MaintenanceInspectionRow,
} from '../repositories/maintenance-inspections.repository';

export const maintenanceInspectionPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

const statuses = ['scheduled', 'completed'];
const results = ['ok', 'attention', 'na'];

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function mapItemRow(row: MaintenanceInspectionItemRow) {
  return {
    id: row.id,
    label: row.label,
    result: row.result,
    observation: row.observation || '',
  };
}

export function mapInspectionRow(row: MaintenanceInspectionRow) {
  const items = Array.isArray(row.items) ? row.items.map(mapItemRow) : [];
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name || '',
    vehiclePlate: row.vehicle_plate || '',
    status: row.status,
    inspectedOn: row.inspected_on,
    odometer: row.odometer !== null && row.odometer !== undefined ? Number(row.odometer) : null,
    mechanicName: row.mechanic_name || '',
    nextDueOn: row.next_due_on || '',
    nextDueKm: row.next_due_km !== null && row.next_due_km !== undefined ? Number(row.next_due_km) : null,
    notes: row.notes || '',
    items,
    attentionCount: items.filter((item) => item.result === 'attention').length,
    okCount: items.filter((item) => item.result === 'ok').length,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw validationError('Inclua ao menos um item no checklist da inspecao.', 'invalid_inspection_items', 'items');
  }

  return rawItems.map((raw, index) => {
    const item = (raw || {}) as Record<string, unknown>;
    const label = normalizeRequiredText(item.label as string);
    const result = normalizeOptionalText(item.result as string) || 'ok';

    if (label.length < 2) {
      throw validationError(`Informe a descricao do item ${index + 1} do checklist.`, 'invalid_inspection_item_label', 'items');
    }
    if (!results.includes(result)) {
      throw validationError(`Informe um resultado valido para o item ${index + 1}.`, 'invalid_inspection_item_result', 'items');
    }

    return {
      label,
      result: result as 'ok' | 'attention' | 'na',
      observation: normalizeOptionalText(item.observation as string),
    };
  });
}

async function validateInspectionPayload(body: Record<string, unknown>, tenantId?: string) {
  const vehicleId = normalizeOptionalText(body.vehicleId as string) || '';
  const status = normalizeOptionalText(body.status as string) || 'completed';
  const inspectedOn = normalizeOptionalText(body.inspectedOn as string) || '';
  const mechanicName = normalizeOptionalText(body.mechanicName as string);
  const nextDueOn = normalizeOptionalText(body.nextDueOn as string);
  const notes = normalizeOptionalText(body.notes as string);

  if (!isValidUuid(vehicleId)) {
    throw validationError('Selecione o veiculo da inspecao.', 'invalid_inspection_vehicle', 'vehicleId');
  }
  if (!statuses.includes(status)) {
    throw validationError('Informe um status valido para a inspecao.', 'invalid_inspection_status', 'status');
  }
  if (!isValidDate(inspectedOn)) {
    throw validationError('Informe a data da inspecao.', 'invalid_inspection_date', 'inspectedOn');
  }
  if (nextDueOn && !isValidDate(nextDueOn)) {
    throw validationError('Informe uma data valida para o proximo vencimento.', 'invalid_inspection_next_due_on', 'nextDueOn');
  }

  const parseOptionalNumber = (value: unknown, field: string) => {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric < 0) {
      throw validationError('Informe um valor de quilometragem valido.', 'invalid_inspection_km', field);
    }
    return round(numeric);
  };

  const odometer = parseOptionalNumber(body.odometer, 'odometer');
  const nextDueKm = parseOptionalNumber(body.nextDueKm, 'nextDueKm');

  const items = validateItems(body.items);

  const vehicle = await findVehicleBelongsToTenant(vehicleId, tenantId);
  if (!vehicle) {
    throw validationError('Veiculo nao encontrado para esta transportadora.', 'invalid_inspection_vehicle', 'vehicleId');
  }

  return {
    vehicleId,
    status,
    inspectedOn,
    odometer,
    mechanicName,
    nextDueOn: nextDueOn || null,
    nextDueKm,
    notes,
    items,
  };
}

export async function listInspections(auth?: AuthContext) {
  const rows = await listTenantInspections(auth?.tenantId);
  return rows.map(mapInspectionRow);
}

export async function getInspection(auth: AuthContext | undefined, id: string) {
  const row = await findTenantInspection(id, auth?.tenantId);
  return row ? mapInspectionRow(row) : null;
}

export async function createInspection(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = await validateInspectionPayload(body, auth?.tenantId);
  const row = await insertTenantInspection(payload, auth?.tenantId, auth?.userId);
  return row ? mapInspectionRow(row) : null;
}

export async function updateInspection(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = await validateInspectionPayload(body, auth?.tenantId);
  const row = await updateTenantInspection(id, payload, auth?.tenantId, auth?.userId);
  return row ? mapInspectionRow(row) : undefined;
}

export async function deleteInspection(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantInspection(id, auth?.tenantId);
  return Boolean(row);
}
