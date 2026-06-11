import type { PoolClient } from 'pg';
import { pool } from '../../../shared/infra/database/pool';
import type { FiscalDocumentPayload, FiscalDocumentRow, FiscalPartyPayload, FiscalPartyRow } from '../dtos/fiscal-document.types';

function db(client?: PoolClient) {
  return client || pool;
}

function selectDocumentColumns() {
  return `id,
          display_id,
          document_type,
          model,
          series,
          number,
          access_key,
          status,
          issue_date,
          due_date,
          amount,
          origin_name,
          destination_name,
          taker_name,
          protocol,
          authorized_at,
          xml,
          dacte_url,
          provider,
          provider_document_id,
          idempotency_key,
          tax_data,
          emitter_snapshot,
          notes,
          created_at,
          updated_at`;
}

function selectPartyColumns() {
  return `id,
          display_id,
          fiscal_document_id,
          role,
          name,
          document_number,
          state_registration,
          city,
          state`;
}

export async function listTenantFiscalDocuments(tenantId?: string) {
  const result = await pool.query<FiscalDocumentRow>(
    `select ${selectDocumentColumns()}
     from fiscal_documents
     where tenant_id = $1
     order by issue_date desc, created_at desc`,
    [tenantId]
  );

  return result.rows;
}

export async function findTenantFiscalDocument(id: string, tenantId?: string) {
  const result = await pool.query<FiscalDocumentRow>(
    `select ${selectDocumentColumns()}
     from fiscal_documents
     where id = $1
       and tenant_id = $2
     limit 1`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}

export async function listFiscalDocumentParties(documentId: string, tenantId?: string) {
  const result = await pool.query<FiscalPartyRow>(
    `select ${selectPartyColumns()}
     from fiscal_document_parties
     where fiscal_document_id = $1
       and tenant_id = $2
     order by display_id asc, created_at asc`,
    [documentId, tenantId]
  );

  return result.rows;
}

export async function findFiscalDocumentDuplicate(payload: FiscalDocumentPayload, tenantId?: string, ignoreId?: string) {
  const result = await pool.query<{ id: string }>(
    `select id
     from fiscal_documents
     where tenant_id = $1
       and document_type = $2
       and series = $3
       and number = $4
       and status <> 'canceled'
       and ($5::uuid is null or id <> $5)
     limit 1`,
    [tenantId, payload.documentType, payload.series, payload.number, ignoreId || null]
  );

  return result.rows[0] || null;
}

export async function findFiscalDocumentByAccessKey(accessKey: string, tenantId?: string, ignoreId?: string) {
  const result = await pool.query<{ id: string }>(
    `select id
     from fiscal_documents
     where tenant_id = $1
       and access_key = $2
       and ($3::uuid is null or id <> $3)
     limit 1`,
    [tenantId, accessKey, ignoreId || null]
  );

  return result.rows[0] || null;
}

async function replaceDocumentParties(documentId: string, payload: FiscalDocumentPayload, tenantId?: string) {
  await pool.query(
    `delete from fiscal_document_parties
     where fiscal_document_id = $1
       and tenant_id = $2`,
    [documentId, tenantId]
  );

  for (const party of payload.parties) {
    await pool.query(
      `insert into fiscal_document_parties (
         tenant_id,
         fiscal_document_id,
         role,
         name,
         document_number,
         state_registration,
         city,
         state
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tenantId,
        documentId,
        party.role,
        party.name,
        party.documentNumber || null,
        party.stateRegistration || null,
        party.city || null,
        party.state || null,
      ]
    );
  }
}

export async function createTenantFiscalDocument(payload: FiscalDocumentPayload, tenantId?: string, userId?: string) {
  const result = await pool.query<FiscalDocumentRow>(
    `insert into fiscal_documents (
       tenant_id,
       document_type,
       model,
       series,
       number,
       access_key,
       status,
       issue_date,
       due_date,
       amount,
       origin_name,
       destination_name,
       taker_name,
       protocol,
       authorized_at,
       xml,
       dacte_url,
       provider,
       provider_document_id,
       idempotency_key,
       tax_data,
       emitter_snapshot,
       notes,
       created_by_user_id,
       updated_by_user_id
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $24)
     returning ${selectDocumentColumns()}`,
    [
      tenantId,
      payload.documentType,
      payload.model,
      payload.series,
      payload.number,
      payload.accessKey || null,
      payload.status,
      payload.issueDate,
      payload.dueDate || null,
      payload.amount,
      payload.originName || null,
      payload.destinationName || null,
      payload.takerName || null,
      payload.protocol || null,
      payload.authorizedAt || null,
      payload.xml || null,
      payload.dacteUrl || null,
      payload.provider || null,
      payload.providerDocumentId || null,
      payload.idempotencyKey || null,
      payload.taxData,
      payload.emitterSnapshot,
      payload.notes || null,
      userId,
    ]
  );

  const document = result.rows[0] || null;
  if (document) {
    await replaceDocumentParties(document.id, payload, tenantId);
  }

  return document;
}

export async function updateTenantFiscalDocument(id: string, payload: FiscalDocumentPayload, tenantId?: string, userId?: string) {
  const result = await pool.query<FiscalDocumentRow>(
    `update fiscal_documents
     set document_type = $1,
         model = $2,
         series = $3,
         number = $4,
         access_key = $5,
         status = $6,
         issue_date = $7,
         due_date = $8,
         amount = $9,
         origin_name = $10,
         destination_name = $11,
         taker_name = $12,
         protocol = $13,
         authorized_at = $14,
         xml = $15,
         dacte_url = $16,
         provider = $17,
         provider_document_id = $18,
         idempotency_key = $19,
         tax_data = $20,
         emitter_snapshot = $21,
         notes = $22,
         updated_by_user_id = $23,
         updated_at = now()
     where id = $24
       and tenant_id = $25
     returning ${selectDocumentColumns()}`,
    [
      payload.documentType,
      payload.model,
      payload.series,
      payload.number,
      payload.accessKey || null,
      payload.status,
      payload.issueDate,
      payload.dueDate || null,
      payload.amount,
      payload.originName || null,
      payload.destinationName || null,
      payload.takerName || null,
      payload.protocol || null,
      payload.authorizedAt || null,
      payload.xml || null,
      payload.dacteUrl || null,
      payload.provider || null,
      payload.providerDocumentId || null,
      payload.idempotencyKey || null,
      payload.taxData,
      payload.emitterSnapshot,
      payload.notes || null,
      userId,
      id,
      tenantId,
    ]
  );

  const document = result.rows[0] || null;
  if (document) {
    await replaceDocumentParties(document.id, payload, tenantId);
  }

  return document;
}

export async function deleteTenantFiscalDocument(id: string, tenantId?: string) {
  const result = await pool.query(
    `delete from fiscal_documents
     where id = $1
       and tenant_id = $2
       and status in ('draft', 'rejected', 'error')
     returning id`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}

export async function updateFiscalDocumentAfterProviderAttempt(params: {
  id: string;
  tenantId?: string;
  userId?: string;
  provider: string;
  providerDocumentId?: string | null;
  status: FiscalDocumentRow['status'];
  accessKey?: string | null;
  protocol?: string | null;
  authorizedAt?: string | null;
  xml?: string | null;
  dacteUrl?: string | null;
}) {
  const result = await pool.query<FiscalDocumentRow>(
    `update fiscal_documents
     set provider = $1,
         provider_document_id = coalesce($2, provider_document_id),
         status = $3,
         access_key = coalesce($4, access_key),
         protocol = coalesce($5, protocol),
         authorized_at = coalesce($6, authorized_at),
         xml = coalesce($7, xml),
         dacte_url = coalesce($8, dacte_url),
         updated_by_user_id = $9,
         updated_at = now()
     where id = $10
       and tenant_id = $11
     returning ${selectDocumentColumns()}`,
    [
      params.provider,
      params.providerDocumentId || null,
      params.status,
      params.accessKey || null,
      params.protocol || null,
      params.authorizedAt || null,
      params.xml || null,
      params.dacteUrl || null,
      params.userId || null,
      params.id,
      params.tenantId,
    ],
  );

  return result.rows[0] || null;
}

export async function createFiscalCommunicationLog(params: {
  tenantId?: string;
  fiscalDocumentId?: string | null;
  provider: string;
  operation: string;
  requestPayload?: Record<string, unknown>;
  responsePayload?: Record<string, unknown>;
  httpStatus?: number | null;
  errorMessage?: string | null;
  durationMs?: number | null;
}) {
  const result = await pool.query<{ id: string }>(
    `insert into fiscal_communication_logs (
       tenant_id,
       fiscal_document_id,
       provider,
       operation,
       request_payload,
       response_payload,
       http_status,
       error_message,
       duration_ms
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id`,
    [
      params.tenantId,
      params.fiscalDocumentId || null,
      params.provider,
      params.operation,
      params.requestPayload || {},
      params.responsePayload || {},
      params.httpStatus || null,
      params.errorMessage || null,
      params.durationMs || null,
    ],
  );

  return result.rows[0] || null;
}

export async function upsertFiscalDocumentFromNovalogBillingItem(params: {
  tenantId: string;
  userId?: string | null;
  series: string;
  number: string;
  accessKey?: string | null;
  issueDate: string;
  dueDate?: string | null;
  amount: number;
  originName?: string | null;
  destinationName?: string | null;
  takerName?: string | null;
  notes?: string | null;
}, client?: PoolClient) {
  const accessKey = (params.accessKey || '').replace(/\D/g, '');
  const normalizedAccessKey = accessKey.length === 44 ? accessKey : null;
  const result = await db(client).query<{ id: string }>(
    `insert into fiscal_documents (
       tenant_id,
       document_type,
       model,
       series,
       number,
       access_key,
       status,
       issue_date,
       due_date,
       amount,
       origin_name,
       destination_name,
       taker_name,
       notes,
       created_by_user_id,
       updated_by_user_id
     )
     values ($1, 'cte', '57', $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)
     on conflict (tenant_id, document_type, series, number) where status <> 'canceled' do update set
       access_key = coalesce(excluded.access_key, fiscal_documents.access_key),
       status = case
         when fiscal_documents.status in ('canceled', 'denied', 'inutilized') then fiscal_documents.status
         when excluded.access_key is not null then 'authorized'
         else fiscal_documents.status
       end,
       issue_date = excluded.issue_date,
       due_date = excluded.due_date,
       amount = excluded.amount,
       origin_name = excluded.origin_name,
       destination_name = excluded.destination_name,
       taker_name = excluded.taker_name,
       notes = excluded.notes,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_at = now()
     returning id`,
    [
      params.tenantId,
      params.series,
      params.number,
      normalizedAccessKey,
      normalizedAccessKey ? 'authorized' : 'draft',
      params.issueDate,
      params.dueDate || null,
      params.amount,
      params.originName || null,
      params.destinationName || null,
      params.takerName || null,
      params.notes || null,
      params.userId || null,
    ],
  );

  return result.rows[0]?.id || null;
}
