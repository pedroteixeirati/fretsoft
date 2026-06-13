import { pool } from '../../../shared/infra/database/pool';

export type NfseDocumentRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  company_id: string | null;
  company_name: string | null;
  reference: string;
  status: 'draft' | 'processing' | 'authorized' | 'rejected' | 'canceled' | 'error';
  competence_month: string | null;
  service_amount: string | number;
  service_description: string | null;
  iss_rate: string | number | null;
  iss_retained: boolean;
  number: string | null;
  series: string | null;
  access_key: string | null;
  protocol: string | null;
  authorized_at: string | null;
  xml_url: string | null;
  pdf_url: string | null;
  provider: string | null;
  provider_document_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

const columns = `
  nfse_documents.id,
  nfse_documents.display_id,
  nfse_documents.tenant_id,
  nfse_documents.company_id,
  companies.corporate_name as company_name,
  nfse_documents.reference,
  nfse_documents.status,
  nfse_documents.competence_month,
  nfse_documents.service_amount,
  nfse_documents.service_description,
  nfse_documents.iss_rate,
  nfse_documents.iss_retained,
  nfse_documents.number,
  nfse_documents.series,
  nfse_documents.access_key,
  nfse_documents.protocol,
  nfse_documents.authorized_at,
  nfse_documents.xml_url,
  nfse_documents.pdf_url,
  nfse_documents.provider,
  nfse_documents.provider_document_id,
  nfse_documents.error_message,
  nfse_documents.created_at,
  nfse_documents.updated_at
`;

export async function listTenantNfseDocuments(tenantId?: string) {
  const result = await pool.query<NfseDocumentRow>(
    `select ${columns}
     from nfse_documents
     left join companies on companies.id = nfse_documents.company_id
     where nfse_documents.tenant_id = $1
     order by nfse_documents.created_at desc`,
    [tenantId],
  );
  return result.rows;
}

export async function findTenantNfseDocument(id: string, tenantId?: string) {
  const result = await pool.query<NfseDocumentRow>(
    `select ${columns}
     from nfse_documents
     left join companies on companies.id = nfse_documents.company_id
     where nfse_documents.id = $1
       and nfse_documents.tenant_id = $2
     limit 1`,
    [id, tenantId],
  );
  return result.rows[0] || null;
}

export async function findCompanyForNfse(companyId: string, tenantId?: string) {
  const result = await pool.query<{
    id: string;
    corporate_name: string;
    cnpj: string;
    municipal_registration: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    ibge_code: string | null;
  }>(
    `select id, corporate_name, cnpj, municipal_registration, email, address, city, state, zip_code, ibge_code
     from companies
     where id = $1 and tenant_id = $2
     limit 1`,
    [companyId, tenantId],
  );
  return result.rows[0] || null;
}

export async function insertTenantNfseDocument(payload: Record<string, unknown>, tenantId?: string, userId?: string) {
  const result = await pool.query<{ id: string }>(
    `insert into nfse_documents (
       tenant_id, created_by_user_id, updated_by_user_id,
       company_id, reference, status, competence_month,
       service_amount, service_description, iss_rate, iss_retained,
       request_payload, provider
     )
     values ($1, $2, $2, $3, $4, 'draft', $5, $6, $7, $8, $9, $10::jsonb, $11)
     returning id`,
    [
      tenantId,
      userId || null,
      payload.companyId,
      payload.reference,
      payload.competenceMonth,
      payload.serviceAmount,
      payload.serviceDescription,
      payload.issRate,
      payload.issRetained,
      JSON.stringify(payload.requestPayload || {}),
      payload.provider,
    ],
  );
  const id = result.rows[0]?.id;
  return id ? findTenantNfseDocument(id, tenantId) : null;
}

export async function updateNfseDocumentAfterProvider(
  id: string,
  patch: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const result = await pool.query<{ id: string }>(
    `update nfse_documents
     set status = $1,
         provider = coalesce($2, provider),
         provider_document_id = coalesce($3, provider_document_id),
         access_key = coalesce($4, access_key),
         protocol = coalesce($5, protocol),
         authorized_at = coalesce($6, authorized_at),
         number = coalesce($7, number),
         series = coalesce($8, series),
         xml_url = coalesce($9, xml_url),
         pdf_url = coalesce($10, pdf_url),
         response_payload = $11::jsonb,
         error_message = $12,
         updated_by_user_id = $13,
         updated_at = now()
     where id = $14 and tenant_id = $15
     returning id`,
    [
      patch.status,
      patch.provider || null,
      patch.providerDocumentId || null,
      patch.accessKey || null,
      patch.protocol || null,
      patch.authorizedAt || null,
      patch.number || null,
      patch.series || null,
      patch.xmlUrl || null,
      patch.pdfUrl || null,
      JSON.stringify(patch.responsePayload || {}),
      patch.errorMessage || null,
      userId || null,
      id,
      tenantId,
    ],
  );
  const updatedId = result.rows[0]?.id;
  return updatedId ? findTenantNfseDocument(updatedId, tenantId) : null;
}

export async function deleteTenantNfseDocument(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from nfse_documents where id = $1 and tenant_id = $2 and status = 'draft' returning id`,
    [id, tenantId],
  );
  return result.rows[0] || null;
}
