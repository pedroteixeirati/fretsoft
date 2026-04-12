import { pool } from '../../../shared/infra/database/pool';

export type VehicleRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  name: string;
  plate: string;
  driver: string;
  type: string;
  km: string | number;
  next_maintenance: string | null;
  status: 'active' | 'maintenance' | 'alert';
};

const vehicleColumns = `
  id,
  display_id,
  tenant_id,
  name,
  plate,
  driver,
  type,
  km,
  next_maintenance,
  status
`;

export async function listTenantVehicles(tenantId?: string) {
  const result = await pool.query<VehicleRow>(
    `select ${vehicleColumns}
     from vehicles
     where tenant_id = $1
     order by created_at desc`,
    [tenantId]
  );

  return result.rows;
}

export async function insertTenantVehicle(
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string
) {
  const result = await pool.query<VehicleRow>(
    `insert into vehicles (
      tenant_id,
      created_by_user_id,
      updated_by_user_id,
      name,
      plate,
      driver,
      type,
      km,
      next_maintenance,
      status
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    returning ${vehicleColumns}`,
    [
      tenantId,
      userId,
      userId,
      payload.name,
      payload.plate,
      payload.driver,
      payload.type,
      payload.km,
      payload.nextMaintenance,
      payload.status,
    ]
  );

  return result.rows[0] || null;
}

export async function updateTenantVehicle(
  id: string,
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string
) {
  const result = await pool.query<VehicleRow>(
    `update vehicles
     set name = $1,
         plate = $2,
         driver = $3,
         type = $4,
         km = $5,
         next_maintenance = $6,
         status = $7,
         updated_by_user_id = $8,
         updated_at = now()
     where id = $9
       and tenant_id = $10
     returning ${vehicleColumns}`,
    [
      payload.name,
      payload.plate,
      payload.driver,
      payload.type,
      payload.km,
      payload.nextMaintenance,
      payload.status,
      userId,
      id,
      tenantId,
    ]
  );

  return result.rows[0] || null;
}

export async function deleteTenantVehicle(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from vehicles
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}
