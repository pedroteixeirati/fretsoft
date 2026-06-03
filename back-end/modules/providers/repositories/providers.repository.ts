import { pool } from '../../../shared/infra/database/pool';

export type ProviderRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  name: string;
  type: string;
  usage_type: 'operational' | 'financial' | 'both';
  status: string;
  contact: string | null;
  email: string | null;
  address: string | null;
};

const providerColumns = `
  id,
  display_id,
  tenant_id,
  name,
  type,
  usage_type,
  status,
  contact,
  email,
  address
`;

export async function listTenantProviders(tenantId?: string) {
  const result = await pool.query<ProviderRow>(
    `select ${providerColumns}
     from providers
     where tenant_id = $1
     order by created_at desc`,
    [tenantId]
  );

  return result.rows;
}

export async function insertTenantProvider(
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string
) {
  const result = await pool.query<ProviderRow>(
    `insert into providers (
      tenant_id,
      created_by_user_id,
      updated_by_user_id,
      name,
      type,
      usage_type,
      status,
      contact,
      email,
      address
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    returning ${providerColumns}`,
    [
      tenantId,
      userId,
      userId,
      payload.name,
      payload.type,
      payload.usageType,
      payload.status,
      payload.contact,
      payload.email,
      payload.address,
    ]
  );

  return result.rows[0] || null;
}

export async function updateTenantProvider(
  id: string,
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string
) {
  const result = await pool.query<ProviderRow>(
    `update providers
     set name = $1,
         type = $2,
         usage_type = $3,
         status = $4,
         contact = $5,
         email = $6,
         address = $7,
         updated_by_user_id = $8,
         updated_at = now()
     where id = $9
       and tenant_id = $10
     returning ${providerColumns}`,
    [
      payload.name,
      payload.type,
      payload.usageType,
      payload.status,
      payload.contact,
      payload.email,
      payload.address,
      userId,
      id,
      tenantId,
    ]
  );

  return result.rows[0] || null;
}

export async function deleteTenantProvider(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from providers
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}
