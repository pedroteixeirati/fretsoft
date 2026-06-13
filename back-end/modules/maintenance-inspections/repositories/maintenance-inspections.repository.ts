import { pool } from '../../../shared/infra/database/pool';

export type MaintenanceInspectionItemRow = {
  id: string;
  inspection_id: string;
  label: string;
  result: 'ok' | 'attention' | 'na';
  observation: string | null;
};

export type MaintenanceInspectionRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  vehicle_id: string;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  status: 'scheduled' | 'completed';
  inspected_on: string;
  odometer: string | number | null;
  mechanic_name: string | null;
  next_due_on: string | null;
  next_due_km: string | number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: MaintenanceInspectionItemRow[];
};

const inspectionColumns = `
  maintenance_inspections.id,
  maintenance_inspections.display_id,
  maintenance_inspections.tenant_id,
  maintenance_inspections.vehicle_id,
  vehicles.name as vehicle_name,
  vehicles.plate as vehicle_plate,
  maintenance_inspections.status,
  to_char(maintenance_inspections.inspected_on, 'YYYY-MM-DD') as inspected_on,
  maintenance_inspections.odometer,
  maintenance_inspections.mechanic_name,
  to_char(maintenance_inspections.next_due_on, 'YYYY-MM-DD') as next_due_on,
  maintenance_inspections.next_due_km,
  maintenance_inspections.notes,
  maintenance_inspections.created_at,
  maintenance_inspections.updated_at
`;

const itemColumns = `
  id,
  inspection_id,
  label,
  result,
  observation
`;

type InspectionItemPayload = {
  label: string;
  result: 'ok' | 'attention' | 'na';
  observation: string | null;
};

type InspectionPayload = {
  vehicleId: string;
  status: string;
  inspectedOn: string;
  odometer: number | null;
  mechanicName: string | null;
  nextDueOn: string | null;
  nextDueKm: number | null;
  notes: string | null;
  items: InspectionItemPayload[];
};

async function attachItems(rows: MaintenanceInspectionRow[]) {
  if (rows.length === 0) return rows;

  const ids = rows.map((row) => row.id);
  const itemsResult = await pool.query<MaintenanceInspectionItemRow>(
    `select ${itemColumns}
     from maintenance_inspection_items
     where inspection_id = any($1::uuid[])
     order by created_at asc`,
    [ids],
  );

  const byInspection = new Map<string, MaintenanceInspectionItemRow[]>();
  for (const item of itemsResult.rows) {
    const group = byInspection.get(item.inspection_id) || [];
    group.push(item);
    byInspection.set(item.inspection_id, group);
  }

  return rows.map((row) => ({ ...row, items: byInspection.get(row.id) || [] }));
}

export async function listTenantInspections(tenantId?: string) {
  const result = await pool.query<MaintenanceInspectionRow>(
    `select ${inspectionColumns}
     from maintenance_inspections
     left join vehicles on vehicles.id = maintenance_inspections.vehicle_id
     where maintenance_inspections.tenant_id = $1
     order by maintenance_inspections.inspected_on desc, maintenance_inspections.created_at desc`,
    [tenantId],
  );

  return attachItems(result.rows);
}

export async function findTenantInspection(id: string, tenantId?: string) {
  const result = await pool.query<MaintenanceInspectionRow>(
    `select ${inspectionColumns}
     from maintenance_inspections
     left join vehicles on vehicles.id = maintenance_inspections.vehicle_id
     where maintenance_inspections.id = $1
       and maintenance_inspections.tenant_id = $2
     limit 1`,
    [id, tenantId],
  );

  if (!result.rows[0]) return null;
  const [withItems] = await attachItems([result.rows[0]]);
  return withItems;
}

export async function findVehicleBelongsToTenant(vehicleId: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `select id from vehicles where id = $1 and tenant_id = $2 limit 1`,
    [vehicleId, tenantId],
  );

  return result.rows[0] || null;
}

async function insertItems(
  client: { query: typeof pool.query },
  tenantId: string,
  inspectionId: string,
  items: InspectionItemPayload[],
) {
  for (const item of items) {
    await client.query(
      `insert into maintenance_inspection_items (tenant_id, inspection_id, label, result, observation)
       values ($1, $2, $3, $4, $5)`,
      [tenantId, inspectionId, item.label, item.result, item.observation],
    );
  }
}

export async function insertTenantInspection(payload: InspectionPayload, tenantId?: string, userId?: string) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const result = await client.query<{ id: string }>(
      `insert into maintenance_inspections (
        tenant_id, created_by_user_id, updated_by_user_id, vehicle_id, status, inspected_on,
        odometer, mechanic_name, next_due_on, next_due_km, notes
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      returning id`,
      [
        tenantId,
        userId || null,
        userId || null,
        payload.vehicleId,
        payload.status,
        payload.inspectedOn,
        payload.odometer,
        payload.mechanicName,
        payload.nextDueOn,
        payload.nextDueKm,
        payload.notes,
      ],
    );

    const inspectionId = result.rows[0]?.id;
    if (inspectionId) {
      await insertItems(client, tenantId as string, inspectionId, payload.items);
    }

    await client.query('commit');
    return inspectionId ? findTenantInspection(inspectionId, tenantId) : null;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTenantInspection(
  id: string,
  payload: InspectionPayload,
  tenantId?: string,
  userId?: string,
) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const result = await client.query<{ id: string }>(
      `update maintenance_inspections
       set vehicle_id = $1,
           status = $2,
           inspected_on = $3,
           odometer = $4,
           mechanic_name = $5,
           next_due_on = $6,
           next_due_km = $7,
           notes = $8,
           updated_by_user_id = $9,
           updated_at = now()
       where id = $10
         and tenant_id = $11
       returning id`,
      [
        payload.vehicleId,
        payload.status,
        payload.inspectedOn,
        payload.odometer,
        payload.mechanicName,
        payload.nextDueOn,
        payload.nextDueKm,
        payload.notes,
        userId || null,
        id,
        tenantId,
      ],
    );

    const inspectionId = result.rows[0]?.id;
    if (!inspectionId) {
      await client.query('rollback');
      return undefined;
    }

    await client.query(`delete from maintenance_inspection_items where inspection_id = $1 and tenant_id = $2`, [inspectionId, tenantId]);
    await insertItems(client, tenantId as string, inspectionId, payload.items);

    await client.query('commit');
    return findTenantInspection(inspectionId, tenantId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteTenantInspection(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from maintenance_inspections
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}
