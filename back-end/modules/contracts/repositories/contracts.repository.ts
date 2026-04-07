import { pool } from '../../../shared/infra/database/pool';

export async function findTenantCompanyById(companyId: string, tenantId: string) {
  const result = await pool.query<{ id: string; corporate_name: string }>(
    `select id, corporate_name
     from companies
     where id = $1
       and tenant_id = $2
     limit 1`,
    [companyId, tenantId]
  );

  return result.rows[0] || null;
}

export async function findTenantVehiclesByIds(tenantId: string, vehicleIds: string[]) {
  const result = await pool.query<{ id: string; name: string; plate: string }>(
    `select id, name, plate
     from vehicles
     where tenant_id = $1
       and id = any($2::uuid[])`,
    [tenantId, vehicleIds]
  );

  return result.rows;
}
