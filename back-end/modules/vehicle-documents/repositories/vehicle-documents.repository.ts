import { pool } from '../../../shared/infra/database/pool';

export type VehicleDocumentRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  vehicle_id: string;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  document_type: 'ipva' | 'licenciamento' | 'tacografo' | 'extintor' | 'seguro' | 'inspecao' | 'outro';
  identifier: string | null;
  amount: string | number | null;
  due_date: string;
  status: 'active' | 'archived';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const documentColumns = `
  vehicle_documents.id,
  vehicle_documents.display_id,
  vehicle_documents.tenant_id,
  vehicle_documents.vehicle_id,
  vehicles.name as vehicle_name,
  vehicles.plate as vehicle_plate,
  vehicle_documents.document_type,
  vehicle_documents.identifier,
  vehicle_documents.amount,
  to_char(vehicle_documents.due_date, 'YYYY-MM-DD') as due_date,
  vehicle_documents.status,
  vehicle_documents.notes,
  vehicle_documents.created_at,
  vehicle_documents.updated_at
`;

export async function listTenantVehicleDocuments(tenantId?: string) {
  const result = await pool.query<VehicleDocumentRow>(
    `select ${documentColumns}
     from vehicle_documents
     left join vehicles on vehicles.id = vehicle_documents.vehicle_id
     where vehicle_documents.tenant_id = $1
     order by vehicle_documents.status asc, vehicle_documents.due_date asc, vehicle_documents.created_at desc`,
    [tenantId],
  );

  return result.rows;
}

export async function findVehicleBelongsToTenant(vehicleId: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `select id
     from vehicles
     where id = $1
       and tenant_id = $2
     limit 1`,
    [vehicleId, tenantId],
  );

  return result.rows[0] || null;
}

export async function insertTenantVehicleDocument(
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const result = await pool.query<{ id: string }>(
    `insert into vehicle_documents (
      tenant_id,
      created_by_user_id,
      updated_by_user_id,
      vehicle_id,
      document_type,
      identifier,
      amount,
      due_date,
      status,
      notes
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    returning id`,
    [
      tenantId,
      userId || null,
      userId || null,
      payload.vehicleId,
      payload.documentType,
      payload.identifier,
      payload.amount,
      payload.dueDate,
      payload.status,
      payload.notes,
    ],
  );

  const id = result.rows[0]?.id;
  return id ? findTenantVehicleDocument(id, tenantId) : null;
}

export async function findTenantVehicleDocument(id: string, tenantId?: string) {
  const result = await pool.query<VehicleDocumentRow>(
    `select ${documentColumns}
     from vehicle_documents
     left join vehicles on vehicles.id = vehicle_documents.vehicle_id
     where vehicle_documents.id = $1
       and vehicle_documents.tenant_id = $2
     limit 1`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}

export async function updateTenantVehicleDocument(
  id: string,
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const result = await pool.query<{ id: string }>(
    `update vehicle_documents
     set vehicle_id = $1,
         document_type = $2,
         identifier = $3,
         amount = $4,
         due_date = $5,
         status = $6,
         notes = $7,
         updated_by_user_id = $8,
         updated_at = now()
     where id = $9
       and tenant_id = $10
     returning id`,
    [
      payload.vehicleId,
      payload.documentType,
      payload.identifier,
      payload.amount,
      payload.dueDate,
      payload.status,
      payload.notes,
      userId || null,
      id,
      tenantId,
    ],
  );

  const updatedId = result.rows[0]?.id;
  return updatedId ? findTenantVehicleDocument(updatedId, tenantId) : null;
}

export async function deleteTenantVehicleDocument(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from vehicle_documents
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}
