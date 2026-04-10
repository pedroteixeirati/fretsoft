import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { validationError } from '../../../shared/errors/app-error';
import {
  deleteTenantProvider,
  insertTenantProvider,
  listTenantProviders,
  type ProviderRow,
  updateTenantProvider,
} from '../repositories/providers.repository';
import {
  isValidEmail,
  normalizeRequiredText,
} from '../../../shared/validation/validation';

export const providersPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

function mapProviderRow(row: ProviderRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    name: row.name,
    type: row.type,
    status: row.status,
    contact: row.contact || '',
    email: row.email || '',
    address: row.address || '',
  };
}

export async function validateProviderPayload(body: Record<string, unknown>) {
  const name = normalizeRequiredText(body.name as string);
  const type = normalizeRequiredText(body.type as string);
  const status = normalizeRequiredText(body.status as string);
  const contact = normalizeRequiredText(body.contact as string);
  const email = normalizeRequiredText(body.email as string).toLowerCase();
  const address = normalizeRequiredText(body.address as string);

  if (name.length < 3) throw validationError('Informe um nome valido para o fornecedor.', 'invalid_provider_name', 'name');
  if (type.length < 2) throw validationError('Informe o tipo do fornecedor.', 'invalid_provider_type', 'type');
  if (status.length < 2) throw validationError('Informe o status do fornecedor.', 'invalid_provider_status', 'status');
  if (email && !isValidEmail(email)) throw validationError('Informe um e-mail valido para o fornecedor.', 'invalid_provider_email', 'email');

  return { name, type, status, contact, email, address };
}

export async function listProviders(auth?: AuthContext) {
  const rows = await listTenantProviders(auth?.tenantId);
  return rows.map(mapProviderRow);
}

export async function createProvider(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = await validateProviderPayload(body);
  const row = await insertTenantProvider(payload as Record<string, unknown>, auth?.tenantId, auth?.userId);
  return row ? mapProviderRow(row) : null;
}

export async function updateProvider(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = await validateProviderPayload(body);
  const row = await updateTenantProvider(id, payload as Record<string, unknown>, auth?.tenantId, auth?.userId);
  return row ? mapProviderRow(row) : undefined;
}

export async function deleteProvider(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantProvider(id, auth?.tenantId);
  return Boolean(row);
}
