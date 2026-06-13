import { pool } from '../../../shared/infra/database/pool';

export type TransportLineRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  line_code: string | null;
  client_name: string | null;
  company_id: string | null;
  company_name: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  driver_id: string | null;
  driver_name: string | null;
  shift: 'manha' | 'tarde' | 'noite' | 'integral';
  departure_time: string | null;
  origin: string | null;
  destination: string | null;
  side: string | null;
  seats: number | null;
  status: 'active' | 'inactive';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const columns = `
  transport_lines.id,
  transport_lines.display_id,
  transport_lines.tenant_id,
  transport_lines.line_code,
  transport_lines.client_name,
  transport_lines.company_id,
  companies.corporate_name as company_name,
  transport_lines.vehicle_id,
  vehicles.name as vehicle_name,
  vehicles.plate as vehicle_plate,
  transport_lines.driver_id,
  drivers.name as driver_name,
  transport_lines.shift,
  transport_lines.departure_time,
  transport_lines.origin,
  transport_lines.destination,
  transport_lines.side,
  transport_lines.seats,
  transport_lines.status,
  transport_lines.notes,
  transport_lines.created_at,
  transport_lines.updated_at
`;

const joins = `
  left join companies on companies.id = transport_lines.company_id
  left join vehicles on vehicles.id = transport_lines.vehicle_id
  left join drivers on drivers.id = transport_lines.driver_id
`;

export async function listTenantTransportLines(tenantId?: string) {
  const result = await pool.query<TransportLineRow>(
    `select ${columns} from transport_lines ${joins}
     where transport_lines.tenant_id = $1
     order by transport_lines.line_code asc nulls last, transport_lines.created_at desc`,
    [tenantId],
  );
  return result.rows;
}

export async function findTenantTransportLine(id: string, tenantId?: string) {
  const result = await pool.query<TransportLineRow>(
    `select ${columns} from transport_lines ${joins}
     where transport_lines.id = $1 and transport_lines.tenant_id = $2 limit 1`,
    [id, tenantId],
  );
  return result.rows[0] || null;
}

export async function insertTenantTransportLine(payload: Record<string, unknown>, tenantId?: string, userId?: string) {
  const result = await pool.query<{ id: string }>(
    `insert into transport_lines (
       tenant_id, created_by_user_id, updated_by_user_id,
       line_code, client_name, company_id, vehicle_id, driver_id,
       shift, departure_time, origin, destination, side, seats, status, notes
     )
     values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     returning id`,
    [
      tenantId, userId || null,
      payload.lineCode, payload.clientName, payload.companyId, payload.vehicleId, payload.driverId,
      payload.shift, payload.departureTime, payload.origin, payload.destination, payload.side, payload.seats, payload.status, payload.notes,
    ],
  );
  const id = result.rows[0]?.id;
  return id ? findTenantTransportLine(id, tenantId) : null;
}

export async function updateTenantTransportLine(id: string, payload: Record<string, unknown>, tenantId?: string, userId?: string) {
  const result = await pool.query<{ id: string }>(
    `update transport_lines set
       line_code = $1, client_name = $2, company_id = $3, vehicle_id = $4, driver_id = $5,
       shift = $6, departure_time = $7, origin = $8, destination = $9, side = $10, seats = $11, status = $12, notes = $13,
       updated_by_user_id = $14, updated_at = now()
     where id = $15 and tenant_id = $16 returning id`,
    [
      payload.lineCode, payload.clientName, payload.companyId, payload.vehicleId, payload.driverId,
      payload.shift, payload.departureTime, payload.origin, payload.destination, payload.side, payload.seats, payload.status, payload.notes,
      userId || null, id, tenantId,
    ],
  );
  const updatedId = result.rows[0]?.id;
  return updatedId ? findTenantTransportLine(updatedId, tenantId) : null;
}

export async function deleteTenantTransportLine(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(`delete from transport_lines where id = $1 and tenant_id = $2 returning id`, [id, tenantId]);
  return result.rows[0] || null;
}

export async function findTenantRef(table: 'companies' | 'vehicles' | 'drivers', id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(`select id from ${table} where id = $1 and tenant_id = $2 limit 1`, [id, tenantId]);
  return result.rows[0] || null;
}
