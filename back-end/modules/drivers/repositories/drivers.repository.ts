import { pool } from '../../../shared/infra/database/pool';

export type DriverRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  name: string;
  cpf: string | null;
  cnh_number: string | null;
  cnh_category: string | null;
  cnh_expires_on: string | null;
  phone: string | null;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const columns = `
  id, display_id, tenant_id, name, cpf, cnh_number, cnh_category,
  to_char(cnh_expires_on, 'YYYY-MM-DD') as cnh_expires_on,
  phone, status, notes, created_at, updated_at
`;

export async function listTenantDrivers(tenantId?: string) {
  const result = await pool.query<DriverRow>(
    `select ${columns} from drivers where tenant_id = $1 order by name asc`,
    [tenantId],
  );
  return result.rows;
}

export async function findTenantDriver(id: string, tenantId?: string) {
  const result = await pool.query<DriverRow>(
    `select ${columns} from drivers where id = $1 and tenant_id = $2 limit 1`,
    [id, tenantId],
  );
  return result.rows[0] || null;
}

export async function insertTenantDriver(payload: Record<string, unknown>, tenantId?: string, userId?: string) {
  const result = await pool.query<DriverRow>(
    `insert into drivers (tenant_id, created_by_user_id, updated_by_user_id, name, cpf, cnh_number, cnh_category, cnh_expires_on, phone, status, notes)
     values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     returning ${columns}`,
    [tenantId, userId || null, payload.name, payload.cpf, payload.cnhNumber, payload.cnhCategory, payload.cnhExpiresOn, payload.phone, payload.status, payload.notes],
  );
  return result.rows[0] || null;
}

export async function updateTenantDriver(id: string, payload: Record<string, unknown>, tenantId?: string, userId?: string) {
  const result = await pool.query<DriverRow>(
    `update drivers set name = $1, cpf = $2, cnh_number = $3, cnh_category = $4, cnh_expires_on = $5, phone = $6, status = $7, notes = $8, updated_by_user_id = $9, updated_at = now()
     where id = $10 and tenant_id = $11 returning ${columns}`,
    [payload.name, payload.cpf, payload.cnhNumber, payload.cnhCategory, payload.cnhExpiresOn, payload.phone, payload.status, payload.notes, userId || null, id, tenantId],
  );
  return result.rows[0] || null;
}

export async function deleteTenantDriver(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(`delete from drivers where id = $1 and tenant_id = $2 returning id`, [id, tenantId]);
  return result.rows[0] || null;
}
