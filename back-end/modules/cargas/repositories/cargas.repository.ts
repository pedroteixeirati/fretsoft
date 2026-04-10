import { pool } from '../../../shared/infra/database/pool.ts';

export type CargoRow = {
  id: string;
  display_id: number | null;
  tenant_id: string;
  freight_id: string;
  freight_display_id: number | null;
  freight_route: string;
  company_id: string;
  company_name: string;
  cargo_number: string | null;
  description: string;
  cargo_type: string;
  weight: string | number;
  volume: string | number;
  unit_count: string | number;
  merchandise_value: string | number;
  origin: string;
  destination: string;
  status: 'planned' | 'loading' | 'in_transit' | 'delivered' | 'cancelled';
  scheduled_date: string | null;
  delivered_at: string | null;
  notes: string | null;
};

export async function findTenantFreightForCargo(freightId: string, tenantId: string) {
  const result = await pool.query<{ id: string; display_id: number | null; route: string }>(
    `select id, display_id, route
     from freights
     where id = $1
       and tenant_id = $2
     limit 1`,
    [freightId, tenantId],
  );

  return result.rows[0] || null;
}

export async function listTenantCargos(tenantId: string) {
  const result = await pool.query<CargoRow>(
    `select id, display_id, tenant_id, freight_id, freight_display_id, freight_route, company_id, company_name,
            cargo_number, description, cargo_type, weight, volume, unit_count, merchandise_value,
            origin, destination, status, scheduled_date, delivered_at, notes
     from cargas
     where tenant_id = $1
     order by created_at desc`,
    [tenantId],
  );

  return result.rows;
}

export async function findTenantCompanyForCargo(companyId: string, tenantId: string) {
  const result = await pool.query<{ id: string; trade_name: string; corporate_name: string }>(
    `select id, trade_name, corporate_name
     from companies
     where id = $1
       and tenant_id = $2
     limit 1`,
    [companyId, tenantId],
  );

  return result.rows[0] || null;
}

export async function listTenantCargosByFreight(freightId: string, tenantId: string) {
  const result = await pool.query<CargoRow>(
    `select id, display_id, tenant_id, freight_id, freight_display_id, freight_route, company_id, company_name,
            cargo_number, description, cargo_type, weight, volume, unit_count, merchandise_value,
            origin, destination, status, scheduled_date, delivered_at, notes
     from cargas
     where freight_id = $1
       and tenant_id = $2
     order by created_at desc`,
    [freightId, tenantId],
  );

  return result.rows;
}

export async function insertTenantCargo(
  payload: {
    freightId: string;
    freightDisplayId: number | null;
    freightRoute: string;
    companyId: string;
    companyName: string;
    cargoNumber: string;
    description: string;
    cargoType: string;
    weight: number;
    volume: number;
    unitCount: number;
    merchandiseValue: number;
    origin: string;
    destination: string;
    status: 'planned' | 'loading' | 'in_transit' | 'delivered' | 'cancelled';
    scheduledDate: string;
    deliveredAt: string;
    notes: string;
  },
  tenantId: string,
  userId?: string,
) {
  const result = await pool.query<CargoRow>(
    `insert into cargas (
       tenant_id,
       created_by_user_id,
       updated_by_user_id,
       freight_id,
       freight_display_id,
       freight_route,
       company_id,
       company_name,
       cargo_number,
       description,
       cargo_type,
       weight,
       volume,
       unit_count,
       merchandise_value,
       origin,
       destination,
       status,
       scheduled_date,
       delivered_at,
       notes
     )
     values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     returning id, display_id, tenant_id, freight_id, freight_display_id, freight_route, company_id, company_name,
               cargo_number, description, cargo_type, weight, volume, unit_count, merchandise_value,
               origin, destination, status, scheduled_date, delivered_at, notes`,
    [
      tenantId,
      userId || null,
      payload.freightId,
      payload.freightDisplayId,
      payload.freightRoute,
      payload.companyId,
      payload.companyName,
      payload.cargoNumber || null,
      payload.description,
      payload.cargoType,
      payload.weight,
      payload.volume,
      payload.unitCount,
      payload.merchandiseValue,
      payload.origin,
      payload.destination,
      payload.status,
      payload.scheduledDate || null,
      payload.deliveredAt || null,
      payload.notes || null,
    ],
  );

  return result.rows[0] || null;
}

export async function updateTenantCargo(
  id: string,
  payload: {
    freightId: string;
    freightDisplayId: number | null;
    freightRoute: string;
    companyId: string;
    companyName: string;
    cargoNumber: string;
    description: string;
    cargoType: string;
    weight: number;
    volume: number;
    unitCount: number;
    merchandiseValue: number;
    origin: string;
    destination: string;
    status: 'planned' | 'loading' | 'in_transit' | 'delivered' | 'cancelled';
    scheduledDate: string;
    deliveredAt: string;
    notes: string;
  },
  tenantId: string,
  userId?: string,
) {
  const result = await pool.query<CargoRow>(
    `update cargas
     set freight_id = $1,
         freight_display_id = $2,
         freight_route = $3,
         company_id = $4,
         company_name = $5,
         cargo_number = $6,
         description = $7,
         cargo_type = $8,
         weight = $9,
         volume = $10,
         unit_count = $11,
         merchandise_value = $12,
         origin = $13,
         destination = $14,
         status = $15,
         scheduled_date = $16,
         delivered_at = $17,
         notes = $18,
         updated_by_user_id = $19,
         updated_at = now()
     where id = $20
       and tenant_id = $21
     returning id, display_id, tenant_id, freight_id, freight_display_id, freight_route, company_id, company_name,
               cargo_number, description, cargo_type, weight, volume, unit_count, merchandise_value,
               origin, destination, status, scheduled_date, delivered_at, notes`,
    [
      payload.freightId,
      payload.freightDisplayId,
      payload.freightRoute,
      payload.companyId,
      payload.companyName,
      payload.cargoNumber || null,
      payload.description,
      payload.cargoType,
      payload.weight,
      payload.volume,
      payload.unitCount,
      payload.merchandiseValue,
      payload.origin,
      payload.destination,
      payload.status,
      payload.scheduledDate || null,
      payload.deliveredAt || null,
      payload.notes || null,
      userId || null,
      id,
      tenantId,
    ],
  );

  return result.rows[0] || null;
}

export async function deleteTenantCargo(id: string, tenantId: string) {
  const result = await pool.query<{ id: string }>(
    `delete from cargas
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}
