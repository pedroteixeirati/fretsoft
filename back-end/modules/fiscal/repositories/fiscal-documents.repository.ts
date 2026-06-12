import type { PoolClient } from 'pg';
import { pool } from '../../../shared/infra/database/pool';
import type { FiscalCommunicationLogRow, FiscalDocumentPayload, FiscalDocumentRow, FiscalEventRow, FiscalPartyPayload, FiscalPartyRow, FiscalPaymentRow } from '../dtos/fiscal-document.types';

function db(client?: PoolClient) {
  return client || pool;
}

function selectDocumentColumns() {
  return `id,
          tenant_id,
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
          source_freight_id,
          execution_mode,
          ciot,
          rntrc,
          cte_data,
          mdfe_data,
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
          state,
          phone,
          street,
          number,
          district,
          zip_code,
          city_ibge_code`;
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

export async function findFiscalDocumentForProviderWebhook(params: {
  documentType?: FiscalDocumentRow['document_type'] | 'cte_or_cte_os' | null;
  providerDocumentId?: string | null;
  accessKey?: string | null;
}) {
  const providerDocumentId = params.providerDocumentId || null;
  const accessKey = params.accessKey || null;
  const result = await pool.query<FiscalDocumentRow>(
    `select ${selectDocumentColumns()}
     from fiscal_documents
     where ($1::text is not null and provider_document_id = $1)
        or ($2::text is not null and access_key = $2)
     order by
       case
         when $3::text = 'mdfe' and document_type = 'mdfe' then 0
         when $3::text = 'cte_or_cte_os' and document_type in ('cte', 'cte_os') then 0
         when $3::text = document_type then 0
         else 1
       end,
       updated_at desc
     limit 1`,
    [providerDocumentId, accessKey, params.documentType || null],
  );

  return result.rows[0] || null;
}

export type TenantEmitterRow = {
  cnpj: string | null;
  state_registration: string | null;
  name: string;
  trade_name: string | null;
  crt: string | null;
  phone: string | null;
  zip_code: string | null;
  ibge_code: string | null;
  address_line: string | null;
  address_number: string | null;
  address_complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
};

export async function findTenantEmitter(tenantId?: string) {
  const result = await pool.query<TenantEmitterRow>(
    `select cnpj, state_registration, name, trade_name, crt, phone, zip_code, ibge_code,
            address_line, address_number, address_complement, district, city, state
     from tenants
     where id = $1
     limit 1`,
    [tenantId]
  );

  return result.rows[0] || null;
}

export type ContractCompanyRow = {
  corporate_name: string | null;
  trade_name: string | null;
  cnpj: string | null;
  state_registration: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
};

export async function findContractCompanyForFreight(contractId: string, tenantId?: string) {
  const result = await pool.query<ContractCompanyRow>(
    `select co.corporate_name, co.trade_name, co.cnpj, co.state_registration,
            co.address, co.city, co.state, co.zip_code
     from contracts c
     join companies co on co.id = c.company_id
     where c.id = $1
       and c.tenant_id = $2
     limit 1`,
    [contractId, tenantId]
  );

  return result.rows[0] || null;
}

export async function findFiscalDocumentBySourceFreight(freightId: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `select id
     from fiscal_documents
     where tenant_id = $1
       and source_freight_id = $2
       and status <> 'canceled'
     limit 1`,
    [tenantId, freightId]
  );

  return result.rows[0] || null;
}

export async function listFiscalDocumentPayments(documentId: string, tenantId?: string) {
  const result = await pool.query<FiscalPaymentRow>(
    `select id,
            display_id,
            fiscal_document_id,
            payee_name,
            payee_document,
            component_type,
            amount,
            bank_name,
            bank_branch,
            bank_account,
            pix_key
     from fiscal_document_payments
     where fiscal_document_id = $1
       and tenant_id = $2
     order by display_id asc, created_at asc`,
    [documentId, tenantId]
  );

  return result.rows;
}

async function replaceDocumentPayments(documentId: string, payload: FiscalDocumentPayload, tenantId?: string) {
  await pool.query(
    `delete from fiscal_document_payments
     where fiscal_document_id = $1
       and tenant_id = $2`,
    [documentId, tenantId]
  );

  for (const payment of payload.payments) {
    await pool.query(
      `insert into fiscal_document_payments (
         tenant_id,
         fiscal_document_id,
         payee_name,
         payee_document,
         component_type,
         amount,
         bank_name,
         bank_branch,
         bank_account,
         pix_key
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tenantId,
        documentId,
        payment.payeeName || null,
        payment.payeeDocument || null,
        payment.componentType,
        payment.amount,
        payment.bankName || null,
        payment.bankBranch || null,
        payment.bankAccount || null,
        payment.pixKey || null,
      ]
    );
  }
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
         state,
         phone,
         street,
         number,
         district,
         zip_code,
         city_ibge_code
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        tenantId,
        documentId,
        party.role,
        party.name,
        party.documentNumber || null,
        party.stateRegistration || null,
        party.city || null,
        party.state || null,
        party.phone || null,
        party.street || null,
        party.number || null,
        party.district || null,
        party.zipCode || null,
        party.cityIbgeCode || null,
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
       source_freight_id,
       execution_mode,
       ciot,
       rntrc,
       cte_data,
       mdfe_data,
       created_by_user_id,
       updated_by_user_id
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $30)
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
      payload.sourceFreightId || null,
      payload.executionMode,
      payload.ciot || null,
      payload.rntrc || null,
      payload.cteData || {},
      payload.mdfeData || {},
      userId,
    ]
  );

  const document = result.rows[0] || null;
  if (document) {
    await replaceDocumentParties(document.id, payload, tenantId);
    await replaceDocumentPayments(document.id, payload, tenantId);
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
         source_freight_id = $23,
         execution_mode = $24,
         ciot = $25,
         rntrc = $26,
         cte_data = $27,
         mdfe_data = $28,
         updated_by_user_id = $29,
         updated_at = now()
     where id = $30
       and tenant_id = $31
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
      payload.sourceFreightId || null,
      payload.executionMode,
      payload.ciot || null,
      payload.rntrc || null,
      payload.cteData || {},
      payload.mdfeData || {},
      userId,
      id,
      tenantId,
    ]
  );

  const document = result.rows[0] || null;
  if (document) {
    await replaceDocumentParties(document.id, payload, tenantId);
    await replaceDocumentPayments(document.id, payload, tenantId);
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

export async function setFiscalDocumentMdfeData(id: string, tenantId: string | undefined, mdfeData: Record<string, unknown>, userId?: string) {
  const result = await pool.query<FiscalDocumentRow>(
    `update fiscal_documents
     set mdfe_data = $1,
         updated_by_user_id = $2,
         updated_at = now()
     where id = $3
       and tenant_id = $4
     returning ${selectDocumentColumns()}`,
    [mdfeData, userId || null, id, tenantId]
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

export async function listFiscalCommunicationLogs(fiscalDocumentId: string, tenantId?: string) {
  const result = await pool.query<FiscalCommunicationLogRow>(
    `select l.id,
            l.fiscal_document_id,
            l.provider,
            l.operation,
            l.request_payload,
            l.response_payload,
            l.http_status,
            l.error_message,
            l.duration_ms,
            l.created_at
     from fiscal_communication_logs l
     join fiscal_documents d on d.id = l.fiscal_document_id
     where l.fiscal_document_id = $1
       and l.tenant_id = $2
       and d.tenant_id = $2
     order by l.created_at desc`,
    [fiscalDocumentId, tenantId],
  );

  return result.rows;
}

export async function createFiscalEvent(params: {
  tenantId?: string;
  fiscalDocumentId: string;
  eventType: string;
  status?: string;
  reason?: string | null;
  protocol?: string | null;
  xml?: string | null;
  createdByUserId?: string | null;
}) {
  const result = await pool.query<{ id: string }>(
    `insert into fiscal_events (
       tenant_id,
       fiscal_document_id,
       event_type,
       status,
       reason,
       protocol,
       xml,
       created_by_user_id
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id`,
    [
      params.tenantId,
      params.fiscalDocumentId,
      params.eventType,
      params.status || 'registered',
      params.reason || null,
      params.protocol || null,
      params.xml || null,
      params.createdByUserId || null,
    ],
  );

  return result.rows[0] || null;
}

export async function listFiscalEvents(fiscalDocumentId: string, tenantId?: string) {
  const result = await pool.query<FiscalEventRow>(
    `select e.id,
            e.fiscal_document_id,
            e.event_type,
            e.status,
            e.reason,
            e.protocol,
            e.xml,
            e.created_by_user_id,
            e.created_at
     from fiscal_events e
     join fiscal_documents d on d.id = e.fiscal_document_id
     where e.fiscal_document_id = $1
       and e.tenant_id = $2
       and d.tenant_id = $2
     order by e.created_at desc`,
    [fiscalDocumentId, tenantId],
  );

  return result.rows;
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
