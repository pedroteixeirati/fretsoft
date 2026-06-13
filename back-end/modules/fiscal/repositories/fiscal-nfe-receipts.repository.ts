import { pool } from '../../../shared/infra/database/pool';
import type { FiscalNfeReceiptPayload, FiscalNfeReceiptRow, FiscalNfeReceiptStatus } from '../dtos/fiscal-nfe-receipt.types';

const receiptColumns = `
  id,
  display_id,
  tenant_id,
  source,
  status,
  nfe_key,
  xml,
  sender_snapshot,
  recipient_snapshot,
  totals_snapshot,
  product_snapshot,
  issue_date,
  used_fiscal_document_id,
  notes,
  created_at,
  updated_at
`;

export async function listTenantNfeReceipts(tenantId?: string) {
  const result = await pool.query<FiscalNfeReceiptRow>(
    `select ${receiptColumns}
     from fiscal_nfe_receipts
     where tenant_id = $1
     order by created_at desc`,
    [tenantId],
  );

  return result.rows;
}

export async function findTenantNfeReceipt(id: string, tenantId?: string) {
  const result = await pool.query<FiscalNfeReceiptRow>(
    `select ${receiptColumns}
     from fiscal_nfe_receipts
     where id = $1
       and tenant_id = $2
     limit 1`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}

export async function upsertTenantNfeReceipt(payload: FiscalNfeReceiptPayload, tenantId?: string, userId?: string) {
  const result = await pool.query<{ id: string }>(
    `insert into fiscal_nfe_receipts (
       tenant_id,
       created_by_user_id,
       updated_by_user_id,
       source,
       status,
       nfe_key,
       xml,
       sender_snapshot,
       recipient_snapshot,
       totals_snapshot,
       product_snapshot,
       issue_date,
       notes
     )
     values ($1, $2, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12)
     on conflict (tenant_id, nfe_key) do update set
       source = excluded.source,
       status = case
         when fiscal_nfe_receipts.status = 'used' then fiscal_nfe_receipts.status
         else excluded.status
       end,
       xml = excluded.xml,
       sender_snapshot = excluded.sender_snapshot,
       recipient_snapshot = excluded.recipient_snapshot,
       totals_snapshot = excluded.totals_snapshot,
       product_snapshot = excluded.product_snapshot,
       issue_date = excluded.issue_date,
       notes = excluded.notes,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_at = now()
     returning id`,
    [
      tenantId,
      userId || null,
      payload.source,
      payload.status,
      payload.nfeKey,
      payload.xml,
      JSON.stringify(payload.senderSnapshot),
      JSON.stringify(payload.recipientSnapshot),
      JSON.stringify(payload.totalsSnapshot),
      JSON.stringify(payload.productSnapshot),
      payload.issueDate || null,
      payload.notes,
    ],
  );

  const id = result.rows[0]?.id;
  return id ? findTenantNfeReceipt(id, tenantId) : null;
}

export async function updateTenantNfeReceiptStatus(
  id: string,
  status: FiscalNfeReceiptStatus,
  tenantId?: string,
  userId?: string,
  usedFiscalDocumentId?: string | null,
) {
  const result = await pool.query<{ id: string }>(
    `update fiscal_nfe_receipts
     set status = $1,
         used_fiscal_document_id = $2,
         updated_by_user_id = $3,
         updated_at = now()
     where id = $4
       and tenant_id = $5
     returning id`,
    [status, usedFiscalDocumentId || null, userId || null, id, tenantId],
  );

  const updatedId = result.rows[0]?.id;
  return updatedId ? findTenantNfeReceipt(updatedId, tenantId) : null;
}
