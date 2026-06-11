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
  origin: string;
  destination: string;
  amount: string | number;
  has_carga: boolean;
  execution_mode: 'own_fleet' | 'third_party';
  transport_partner_id: string | null;
};

export async function findTenantFreightById(id: string, tenantId: string) {
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
            origin,
            destination,
            amount,
            has_carga,
            execution_mode,
            transport_partner_id
     from freights
     where id = $1
       and tenant_id = $2
     limit 1`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}

export async function findTenantTransportPartnerForFreight(partnerId: string, tenantId: string) {
  const result = await pool.query<{ id: string }>(
    `select id
     from transport_partners
     where id = $1
       and tenant_id = $2
     limit 1`,
    [partnerId, tenantId]
  );

  return result.rows[0] || null;
}

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
            origin,
            destination,
            amount,
            has_carga,
            execution_mode,
            transport_partner_id
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
    origin: string;
    destination: string;
    amount: number;
    hasCargo: boolean;
    executionMode: 'own_fleet' | 'third_party';
    transportPartnerId: string | null;
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
       origin,
       destination,
       amount,
       has_carga,
       execution_mode,
       transport_partner_id
     )
     values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     returning id,
               display_id,
               tenant_id,
               vehicle_id,
               plate,
               contract_id,
               contract_name,
               billing_type,
               date,
               origin,
               destination,
               amount,
               has_carga,
               execution_mode,
               transport_partner_id`,
    [
      tenantId,
      userId || null,
      payload.vehicleId,
      payload.plate,
      payload.contractId,
      payload.contractName,
      payload.billingType,
      payload.date,
      payload.origin,
      payload.destination,
      payload.amount,
      payload.hasCargo,
      payload.executionMode,
      payload.transportPartnerId,
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
    origin: string;
    destination: string;
    amount: number;
    hasCargo: boolean;
    executionMode: 'own_fleet' | 'third_party';
    transportPartnerId: string | null;
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
         origin = $7,
         destination = $8,
         amount = $9,
         has_carga = $10,
         execution_mode = $11,
         transport_partner_id = $12,
         updated_by_user_id = $13,
         updated_at = now()
     where id = $14
       and tenant_id = $15
     returning id,
               display_id,
               tenant_id,
               vehicle_id,
               plate,
               contract_id,
               contract_name,
               billing_type,
               date,
               origin,
               destination,
               amount,
               has_carga,
               execution_mode,
               transport_partner_id`,
    [
      payload.vehicleId,
      payload.plate,
      payload.contractId,
      payload.contractName,
      payload.billingType,
      payload.date,
      payload.origin,
      payload.destination,
      payload.amount,
      payload.hasCargo,
      payload.executionMode,
      payload.transportPartnerId,
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
