import type { AuthContext } from '../../auth/dtos/auth-context';
import type { FreightRevenueSeedRow } from '../../revenues/dtos/revenue.types';
import { syncFreightRevenue } from '../../revenues/services/revenues.service';
import { resources, type ResourceConfig } from '../../../shared/resources/resources';
import { validateSimpleResourcePayload } from './resource-payload.service';
import {
  createResourceRow,
  deleteFreightRevenueLink,
  deleteResourceRow,
  listResourceRows,
  updateResourceRow,
} from '../repositories/resources.repository';

function mapRow<T extends Record<string, unknown>>(
  row: Record<string, unknown>,
  fields: { api: string; db: string; type?: 'number' }[]
) {
  const mapped: Record<string, unknown> = {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
  };
  for (const field of fields) {
    const value = row[field.db];
    mapped[field.api] = field.type === 'number' && value !== null && value !== undefined
      ? Number(value)
      : value;
  }
  return mapped as T;
}

export function mapResourceRow<T extends Record<string, unknown>>(
  row: Record<string, unknown>,
  resource: ResourceConfig
) {
  return mapRow<T>(row, resource.fields);
}

export function getResourceConfig(resourceName: string): ResourceConfig | null {
  return resources[resourceName] || null;
}

export async function buildResourcePayload(
  resourceName: string,
  body: Record<string, unknown>,
  tenantId: string,
  recordId?: string
) {
  const payload = await validateSimpleResourcePayload(resourceName, body, tenantId, recordId);
  return payload ?? body;
}

export async function listResources(resourceName: string, auth?: AuthContext) {
  const resource = getResourceConfig(resourceName);
  if (!resource) {
    return null;
  }

  return listResourcesByConfig(resource, auth);
}

async function syncFreightIfNeeded(resourceName: string, row: Record<string, unknown>, userId?: string, tenantId?: string) {
  if (resourceName !== 'freights') {
    return;
  }

  await syncFreightRevenue(tenantId, {
    id: row.id as string,
    plate: String(row.plate || ''),
    contract_id: (row.contract_id as string | null) || null,
    contract_name: (row.contract_name as string | null) || null,
    billing_type: (row.billing_type as FreightRevenueSeedRow['billing_type']) || 'standalone',
    date: String(row.date || ''),
    route: String(row.route || ''),
    amount: row.amount as string | number,
  }, userId);
}

export async function createResource(resourceName: string, auth: AuthContext | undefined, body: Record<string, unknown>) {
  const resource = getResourceConfig(resourceName);
  if (!resource) {
    return null;
  }

  return createResourceByConfig(resourceName, resource, auth, body);
}

export async function updateResource(resourceName: string, auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const resource = getResourceConfig(resourceName);
  if (!resource) {
    return null;
  }

  return updateResourceByConfig(resourceName, resource, auth, id, body);
}

export async function listResourcesByConfig(resource: ResourceConfig, auth?: AuthContext) {
  const rows = await listResourceRows(resource, auth?.tenantId);
  return rows.map((row) => mapRow(row, resource.fields));
}

export async function createResourceByConfig(
  resourceName: string,
  resource: ResourceConfig,
  auth: AuthContext | undefined,
  body: Record<string, unknown>
) {
  const payload = await buildResourcePayload(resourceName, body, auth?.tenantId || '');
  const row = await createResourceRow(resource, payload as Record<string, unknown>, auth?.tenantId, auth?.userId);
  if (!row) {
    return null;
  }

  await syncFreightIfNeeded(resourceName, row, auth?.userId, auth?.tenantId);
  return mapRow(row, resource.fields);
}

export async function updateResourceByConfig(
  resourceName: string,
  resource: ResourceConfig,
  auth: AuthContext | undefined,
  id: string,
  body: Record<string, unknown>
) {
  const payload = await buildResourcePayload(resourceName, body, auth?.tenantId || '', id);
  const row = await updateResourceRow(resource, payload as Record<string, unknown>, id, auth?.tenantId, auth?.userId);
  if (!row) {
    return undefined;
  }

  await syncFreightIfNeeded(resourceName, row, auth?.userId, auth?.tenantId);
  return mapRow(row, resource.fields);
}

export async function removeResource(resourceName: string, auth: AuthContext | undefined, id: string) {
  const resource = getResourceConfig(resourceName);
  if (!resource) {
    return null;
  }

  return removeResourceByConfig(resourceName, resource, auth, id);
}

export async function removeResourceByConfig(
  resourceName: string,
  resource: ResourceConfig,
  auth: AuthContext | undefined,
  id: string
) {
  if (resourceName === 'freights') {
    await deleteFreightRevenueLink(id, auth?.tenantId);
  }

  const deleted = await deleteResourceRow(resource, id, auth?.tenantId);
  return deleted ? true : false;
}
