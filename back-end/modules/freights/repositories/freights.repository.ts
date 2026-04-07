import { pool } from '../../../shared/infra/database/pool';

export async function findTenantVehicleForFreight(vehicleId: string, tenantId: string) {
  const result = await pool.query<{ id: string; plate: string }>(
    `select id, plate
     from vehicles
     where id = $1
       and tenant_id = $2
     limit 1`,
    [vehicleId, tenantId]
  );

  return result.rows[0] || null;
}

export async function findTenantContractForFreight(contractId: string, tenantId: string) {
  const result = await pool.query<{ id: string; contract_name: string; remuneration_type: 'recurring' | 'per_trip'; vehicle_ids: string[] }>(
    `select id, contract_name, remuneration_type, vehicle_ids
     from contracts
     where id = $1
       and tenant_id = $2
     limit 1`,
    [contractId, tenantId]
  );

  return result.rows[0] || null;
}
