import { pool } from '../../../shared/infra/database/pool.ts';

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
  const result = await pool.query<Record<string, unknown>>(
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
