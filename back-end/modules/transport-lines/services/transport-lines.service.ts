import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidTime, isValidUuid, normalizeOptionalText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  deleteTenantTransportLine,
  findTenantRef,
  insertTenantTransportLine,
  listTenantTransportLines,
  updateTenantTransportLine,
  type TransportLineRow,
} from '../repositories/transport-lines.repository';

export const transportLinesPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

const shifts = ['manha', 'tarde', 'noite', 'integral'];

export function mapTransportLineRow(row: TransportLineRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    lineCode: row.line_code || '',
    clientName: row.client_name || '',
    companyId: row.company_id || '',
    companyName: row.company_name || '',
    vehicleId: row.vehicle_id || '',
    vehicleName: row.vehicle_name || '',
    vehiclePlate: row.vehicle_plate || '',
    driverId: row.driver_id || '',
    driverName: row.driver_name || '',
    shift: row.shift,
    departureTime: row.departure_time || '',
    origin: row.origin || '',
    destination: row.destination || '',
    side: row.side || '',
    seats: row.seats !== null && row.seats !== undefined ? Number(row.seats) : null,
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function validatePayload(body: Record<string, unknown>, tenantId?: string) {
  const shift = normalizeOptionalText(body.shift as string) || 'manha';
  const departureTime = normalizeOptionalText(body.departureTime as string);
  const status = normalizeOptionalText(body.status as string) || 'active';
  const companyId = normalizeOptionalText(body.companyId as string);
  const vehicleId = normalizeOptionalText(body.vehicleId as string);
  const driverId = normalizeOptionalText(body.driverId as string);
  const clientName = normalizeOptionalText(body.clientName as string);

  if (!shifts.includes(shift)) {
    throw validationError('Informe um turno valido.', 'invalid_line_shift', 'shift');
  }
  if (departureTime && !isValidTime(departureTime)) {
    throw validationError('Informe um horario valido (HH:MM).', 'invalid_line_departure_time', 'departureTime');
  }
  if (!['active', 'inactive'].includes(status)) {
    throw validationError('Status da linha invalido.', 'invalid_line_status', 'status');
  }
  if (!companyId && !clientName) {
    throw validationError('Informe o cliente (cadastrado ou pelo nome).', 'invalid_line_client', 'companyId');
  }

  let seats: number | null = null;
  if (body.seats !== undefined && body.seats !== null && String(body.seats).trim() !== '') {
    const numeric = Number(body.seats);
    if (!Number.isInteger(numeric) || numeric < 0) {
      throw validationError('Numero de lugares invalido.', 'invalid_line_seats', 'seats');
    }
    seats = numeric;
  }

  for (const [field, table, id] of [
    ['companyId', 'companies', companyId],
    ['vehicleId', 'vehicles', vehicleId],
    ['driverId', 'drivers', driverId],
  ] as const) {
    if (id) {
      if (!isValidUuid(id)) throw validationError('Vinculo invalido.', `invalid_line_${field}`, field);
      const ref = await findTenantRef(table, id, tenantId);
      if (!ref) throw validationError('Vinculo nao encontrado para esta transportadora.', `invalid_line_${field}`, field);
    }
  }

  return {
    lineCode: normalizeOptionalText(body.lineCode as string),
    clientName,
    companyId: companyId || null,
    vehicleId: vehicleId || null,
    driverId: driverId || null,
    shift,
    departureTime,
    origin: normalizeOptionalText(body.origin as string),
    destination: normalizeOptionalText(body.destination as string),
    side: normalizeOptionalText(body.side as string),
    seats,
    status,
    notes: normalizeOptionalText(body.notes as string),
  };
}

export async function listTransportLines(auth?: AuthContext) {
  const rows = await listTenantTransportLines(auth?.tenantId);
  return rows.map(mapTransportLineRow);
}

export async function createTransportLine(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = await validatePayload(body, auth?.tenantId);
  const row = await insertTenantTransportLine(payload, auth?.tenantId, auth?.userId);
  return row ? mapTransportLineRow(row) : null;
}

export async function updateTransportLine(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = await validatePayload(body, auth?.tenantId);
  const row = await updateTenantTransportLine(id, payload, auth?.tenantId, auth?.userId);
  return row ? mapTransportLineRow(row) : undefined;
}

export async function deleteTransportLine(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantTransportLine(id, auth?.tenantId);
  return Boolean(row);
}
