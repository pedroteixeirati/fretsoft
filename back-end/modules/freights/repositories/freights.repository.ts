import { pool } from '../../../shared/infra/database/pool';

export type FreightRow = {
  id: string;
  display_id: number | null;
  tenant_id: string;
  vehicle_id: string;
  plate: string;
  contract_id: string | null;
  contract_name: string | null;
  billing_type: 'standalone' | 'contract_recurring' | 'contract_per_trip';
  date: string;
  route: string;
  amount: string | number;
  has_carga: boolean;
};

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

export async function listTenantFreights(tenantId: string) {
  const result = await pool.query<FreightRow>(
    `select id,
            display_id,
            tenant_id,
            vehicle_id,
            plate,
            contract_id,
            contract_name,
            billing_type,
            date,
            route,
            amount,
            has_carga
     from freights
     where tenant_id = $1
     order by date desc`,
    [tenantId]
  );

  return result.rows;
}

export async function insertTenantFreight(
  payload: {
    vehicleId: string;
    plate: string;
    contractId: string | null;
    contractName: string;
    billingType: 'standalone' | 'contract_recurring' | 'contract_per_trip';
    date: string;
    route: string;
    amount: number;
    hasCargo: boolean;
  },
  tenantId: string,
  userId?: string
) {
  const result = await pool.query<FreightRow>(
    `insert into freights (
       tenant_id,
       created_by_user_id,
       updated_by_user_id,
       vehicle_id,
       plate,
       contract_id,
       contract_name,
       billing_type,
       date,
       route,
       amount,
       has_carga
     )
     values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     returning id,
               display_id,
               tenant_id,
               vehicle_id,
               plate,
               contract_id,
               contract_name,
               billing_type,
               date,
               route,
               amount,
               has_carga`,
    [
      tenantId,
      userId || null,
      payload.vehicleId,
      payload.plate,
      payload.contractId,
      payload.contractName,
      payload.billingType,
      payload.date,
      payload.route,
      payload.amount,
      payload.hasCargo,
    ]
  );

  return result.rows[0] || null;
}

export async function updateTenantFreight(
  id: string,
  payload: {
    vehicleId: string;
    plate: string;
    contractId: string | null;
    contractName: string;
    billingType: 'standalone' | 'contract_recurring' | 'contract_per_trip';
    date: string;
    route: string;
    amount: number;
    hasCargo: boolean;
  },
  tenantId: string,
  userId?: string
) {
  const result = await pool.query<FreightRow>(
    `update freights
     set vehicle_id = $1,
         plate = $2,
         contract_id = $3,
         contract_name = $4,
         billing_type = $5,
         date = $6,
         route = $7,
         amount = $8,
         has_carga = $9,
         updated_by_user_id = $10,
         updated_at = now()
     where id = $11
       and tenant_id = $12
     returning id,
               display_id,
               tenant_id,
               vehicle_id,
               plate,
               contract_id,
               contract_name,
               billing_type,
               date,
               route,
               amount,
               has_carga`,
    [
      payload.vehicleId,
      payload.plate,
      payload.contractId,
      payload.contractName,
      payload.billingType,
      payload.date,
      payload.route,
      payload.amount,
      payload.hasCargo,
      userId || null,
      id,
      tenantId,
    ]
  );

  return result.rows[0] || null;
}

export async function deleteTenantFreight(id: string, tenantId: string) {
  const result = await pool.query<{ id: string }>(
    `delete from freights
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId]
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
