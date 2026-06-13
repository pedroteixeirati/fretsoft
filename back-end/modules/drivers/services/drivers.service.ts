import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidDate, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  deleteTenantDriver,
  insertTenantDriver,
  listTenantDrivers,
  updateTenantDriver,
  type DriverRow,
} from '../repositories/drivers.repository';

export const driversPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

export function mapDriverRow(row: DriverRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    name: row.name,
    cpf: row.cpf || '',
    cnhNumber: row.cnh_number || '',
    cnhCategory: row.cnh_category || '',
    cnhExpiresOn: row.cnh_expires_on || '',
    phone: row.phone || '',
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatePayload(body: Record<string, unknown>) {
  const name = normalizeRequiredText(body.name as string);
  const cnhExpiresOn = normalizeOptionalText(body.cnhExpiresOn as string);
  const status = normalizeOptionalText(body.status as string) || 'active';

  if (name.length < 3) {
    throw validationError('Informe o nome do motorista.', 'invalid_driver_name', 'name');
  }
  if (cnhExpiresOn && !isValidDate(cnhExpiresOn)) {
    throw validationError('Informe uma validade de CNH valida.', 'invalid_driver_cnh_expires', 'cnhExpiresOn');
  }
  if (!['active', 'inactive'].includes(status)) {
    throw validationError('Status do motorista invalido.', 'invalid_driver_status', 'status');
  }

  return {
    name,
    cpf: (normalizeOptionalText(body.cpf as string) || '').replace(/\D/g, '') || null,
    cnhNumber: normalizeOptionalText(body.cnhNumber as string),
    cnhCategory: normalizeOptionalText(body.cnhCategory as string),
    cnhExpiresOn: cnhExpiresOn || null,
    phone: (normalizeOptionalText(body.phone as string) || '').replace(/\D/g, '') || null,
    status,
    notes: normalizeOptionalText(body.notes as string),
  };
}

export async function listDrivers(auth?: AuthContext) {
  const rows = await listTenantDrivers(auth?.tenantId);
  return rows.map(mapDriverRow);
}

export async function createDriver(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = validatePayload(body);
  const row = await insertTenantDriver(payload, auth?.tenantId, auth?.userId);
  return row ? mapDriverRow(row) : null;
}

export async function updateDriver(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = validatePayload(body);
  const row = await updateTenantDriver(id, payload, auth?.tenantId, auth?.userId);
  return row ? mapDriverRow(row) : undefined;
}

export async function deleteDriver(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantDriver(id, auth?.tenantId);
  return Boolean(row);
}
