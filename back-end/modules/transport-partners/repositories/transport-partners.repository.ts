import { pool } from '../../../shared/infra/database/pool';
import type { TransportPartnerPayload, TransportPartnerRow } from '../dtos/transport-partner.types';

function selectColumns() {
  return `id,
          display_id,
          tenant_id,
          name,
          document_number,
          partner_type,
          rntrc,
          bank_name,
          bank_branch,
          bank_account,
          bank_account_type,
          pix_key,
          pix_key_type,
          status,
          notes,
          created_at,
          updated_at`;
}

export async function listTenantTransportPartners(tenantId: string) {
  const result = await pool.query<TransportPartnerRow>(
    `select ${selectColumns()}
     from transport_partners
     where tenant_id = $1
     order by name asc`,
    [tenantId]
  );

  return result.rows;
}

export async function findTenantTransportPartner(id: string, tenantId: string) {
  const result = await pool.query<TransportPartnerRow>(
    `select ${selectColumns()}
     from transport_partners
     where id = $1
       and tenant_id = $2
     limit 1`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}

export async function findTransportPartnerByDocument(documentNumber: string, tenantId: string, ignoreId?: string) {
  const result = await pool.query<{ id: string }>(
    `select id
     from transport_partners
     where tenant_id = $1
       and document_number = $2
       and ($3::uuid is null or id <> $3)
     limit 1`,
    [tenantId, documentNumber, ignoreId || null]
  );

  return result.rows[0] || null;
}

export async function insertTenantTransportPartner(payload: TransportPartnerPayload, tenantId: string, userId?: string) {
  const result = await pool.query<TransportPartnerRow>(
    `insert into transport_partners (
       tenant_id,
       created_by_user_id,
       updated_by_user_id,
       name,
       document_number,
       partner_type,
       rntrc,
       bank_name,
       bank_branch,
       bank_account,
       bank_account_type,
       pix_key,
       pix_key_type,
       status,
       notes
     )
     values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     returning ${selectColumns()}`,
    [
      tenantId,
      userId || null,
      payload.name,
      payload.documentNumber,
      payload.partnerType,
      payload.rntrc || null,
      payload.bankName || null,
      payload.bankBranch || null,
      payload.bankAccount || null,
      payload.bankAccountType || null,
      payload.pixKey || null,
      payload.pixKeyType || null,
      payload.status,
      payload.notes || null,
    ]
  );

  return result.rows[0] || null;
}

export async function updateTenantTransportPartner(id: string, payload: TransportPartnerPayload, tenantId: string, userId?: string) {
  const result = await pool.query<TransportPartnerRow>(
    `update transport_partners
     set name = $1,
         document_number = $2,
         partner_type = $3,
         rntrc = $4,
         bank_name = $5,
         bank_branch = $6,
         bank_account = $7,
         bank_account_type = $8,
         pix_key = $9,
         pix_key_type = $10,
         status = $11,
         notes = $12,
         updated_by_user_id = $13,
         updated_at = now()
     where id = $14
       and tenant_id = $15
     returning ${selectColumns()}`,
    [
      payload.name,
      payload.documentNumber,
      payload.partnerType,
      payload.rntrc || null,
      payload.bankName || null,
      payload.bankBranch || null,
      payload.bankAccount || null,
      payload.bankAccountType || null,
      payload.pixKey || null,
      payload.pixKeyType || null,
      payload.status,
      payload.notes || null,
      userId || null,
      id,
      tenantId,
    ]
  );

  return result.rows[0] || null;
}

export async function deleteTenantTransportPartner(id: string, tenantId: string) {
  const result = await pool.query<{ id: string }>(
    `delete from transport_partners
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}
