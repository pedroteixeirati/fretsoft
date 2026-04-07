import { pool } from '../../../shared/infra/database/pool';
import type { ResourceConfig } from '../../../shared/resources/resources';

export async function listResourceRows(resource: ResourceConfig, tenantId?: string) {
  const result = await pool.query(
    `select id, display_id, tenant_id, ${resource.fields.map((field) => field.db).join(', ')}
     from ${resource.table}
     where tenant_id = $1
     order by ${resource.orderBy}`,
    [tenantId]
  );

  return result.rows;
}

export async function createResourceRow(
  resource: ResourceConfig,
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string
) {
  const columns = ['tenant_id', 'created_by_user_id', 'updated_by_user_id', ...resource.fields.map((field) => field.db)];
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');
  const values = [tenantId, userId, userId, ...resource.fields.map((field) => payload[field.api])];

  const result = await pool.query(
    `insert into ${resource.table} (${columns.join(', ')})
     values (${placeholders})
     returning id, display_id, tenant_id, ${resource.fields.map((field) => field.db).join(', ')}`,
    values
  );

  return result.rows[0] || null;
}

export async function updateResourceRow(
  resource: ResourceConfig,
  payload: Record<string, unknown>,
  id: string,
  tenantId?: string,
  userId?: string
) {
  const assignments = [
    ...resource.fields.map((field, index) => `${field.db} = $${index + 1}`),
    `updated_by_user_id = $${resource.fields.length + 1}`,
  ];
  const params = [
    ...resource.fields.map((field) => payload[field.api]),
    userId,
    id,
    tenantId,
  ];

  const result = await pool.query(
    `update ${resource.table}
     set ${assignments.join(', ')}, updated_at = now()
     where id = $${resource.fields.length + 2}
       and tenant_id = $${resource.fields.length + 3}
     returning id, display_id, tenant_id, ${resource.fields.map((field) => field.db).join(', ')}`,
    params
  );

  return result.rows[0] || null;
}

export async function deleteResourceRow(resource: ResourceConfig, id: string, tenantId?: string) {
  const result = await pool.query(
    `delete from ${resource.table}
     where id = $1 and tenant_id = $2
     returning id`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}

export async function deleteFreightRevenueLink(freightId: string, tenantId?: string) {
  await pool.query(
    `delete from revenues
     where freight_id = $1
       and tenant_id = $2`,
    [freightId, tenantId]
  );
}
