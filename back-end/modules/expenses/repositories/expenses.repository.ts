import { pool } from '../../../shared/infra/database/pool';

export async function findTenantVehicleForExpense(vehicleId: string, tenantId: string) {
  const result = await pool.query<{ id: string; name: string }>(
    `select id, name
     from vehicles
     where id = $1
       and tenant_id = $2
     limit 1`,
    [vehicleId, tenantId]
  );

  return result.rows[0] || null;
}
