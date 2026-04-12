import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { conflictError, validationError } from '../../../shared/errors/app-error';
import { pool } from '../../../shared/infra/database/pool';
import {
  deleteTenantVehicle,
  insertTenantVehicle,
  listTenantVehicles,
  type VehicleRow,
  updateTenantVehicle,
} from '../repositories/vehicles.repository';
import {
  isNonNegativeNumber,
  isValidDate,
  isValidPlate,
  normalizeOptionalText,
  normalizePlate,
  normalizeRequiredText,
} from '../../../shared/validation/validation';

export const vehiclesPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

function mapVehicleRow(row: VehicleRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    name: row.name,
    plate: row.plate,
    driver: row.driver,
    type: row.type,
    km: Number(row.km || 0),
    nextMaintenance: row.next_maintenance || '',
    status: row.status,
  };
}

export async function validateVehiclePayload(
  body: Record<string, unknown>,
  tenantId: string,
  recordId?: string
) {
  const name = normalizeRequiredText(body.name as string);
  const plate = normalizePlate(body.plate as string);
  const driver = normalizeRequiredText(body.driver as string);
  const type = normalizeRequiredText(body.type as string);
  const km = Number(body.km ?? 0);
  const nextMaintenance = normalizeOptionalText(body.nextMaintenance as string);
  const status = body.status as string;

  if (name.length < 3) throw validationError('Informe um nome valido para o veiculo.', 'invalid_vehicle_name', 'name');
  if (!isValidPlate(plate)) throw validationError('Informe uma placa valida para o veiculo.', 'invalid_plate', 'plate');
  if (driver.length < 3) throw validationError('Informe o motorista responsavel pelo veiculo.', 'invalid_vehicle_driver', 'driver');
  if (type.length < 3) throw validationError('Informe o tipo do veiculo.', 'invalid_vehicle_type', 'type');
  if (!isNonNegativeNumber(km)) throw validationError('A quilometragem deve ser um numero igual ou maior que zero.', 'invalid_vehicle_km', 'km');
  if (nextMaintenance && !isValidDate(nextMaintenance)) throw validationError('A proxima manutencao deve ser uma data valida.', 'invalid_vehicle_next_maintenance', 'nextMaintenance');
  if (!['active', 'maintenance', 'alert'].includes(status)) throw validationError('Status do veiculo invalido.', 'invalid_vehicle_status', 'status');

  const duplicate = await pool.query<{ id: string }>(
    `select id
     from vehicles
     where tenant_id = $1
       and upper(regexp_replace(plate, '[^A-Za-z0-9]', '', 'g')) = $2
       and ($3::uuid is null or id <> $3::uuid)
     limit 1`,
    [tenantId, plate, recordId || null]
  );

  if (duplicate.rows[0]) throw conflictError('Ja existe um veiculo cadastrado com essa placa.', 'vehicle_plate_conflict', 'plate');

  return { name, plate, driver, type, km, nextMaintenance: nextMaintenance || '', status };
}

export async function listVehicles(auth?: AuthContext) {
  const rows = await listTenantVehicles(auth?.tenantId);
  return rows.map(mapVehicleRow);
}

export async function createVehicle(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = await validateVehiclePayload(body, auth?.tenantId || '');
  const row = await insertTenantVehicle(payload as Record<string, unknown>, auth?.tenantId, auth?.userId);
  return row ? mapVehicleRow(row) : null;
}

export async function updateVehicle(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = await validateVehiclePayload(body, auth?.tenantId || '', id);
  const row = await updateTenantVehicle(id, payload as Record<string, unknown>, auth?.tenantId, auth?.userId);
  return row ? mapVehicleRow(row) : undefined;
}

export async function deleteVehicle(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantVehicle(id, auth?.tenantId);
  return Boolean(row);
}
