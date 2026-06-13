import { randomUUID } from 'node:crypto';
import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidUuid, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { findTenantEmitter } from '../repositories/fiscal-documents.repository';
import { findTenantNfseConfig } from '../repositories/tenant-nfse-config.repository';
import {
  deleteTenantNfseDocument,
  findCompanyForNfse,
  findTenantNfseDocument,
  insertTenantNfseDocument,
  listTenantNfseDocuments,
  updateNfseDocumentAfterProvider,
  type NfseDocumentRow,
} from '../repositories/nfse-documents.repository';
import {
  getNfseProviderAdapter,
  mapNfseFocusPayload,
  type NfseEmitInput,
} from './nfse-provider.service';

export const nfseDocumentPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'financial'],
  update: ['dev', 'owner', 'admin', 'financial'],
  delete: ['dev', 'owner', 'admin'],
};

export function mapNfseDocumentRow(row: NfseDocumentRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    companyId: row.company_id || '',
    companyName: row.company_name || '',
    reference: row.reference,
    status: row.status,
    competenceMonth: row.competence_month || '',
    serviceAmount: Number(row.service_amount || 0),
    serviceDescription: row.service_description || '',
    issRate: row.iss_rate !== null && row.iss_rate !== undefined ? Number(row.iss_rate) : null,
    issRetained: row.iss_retained,
    number: row.number || '',
    series: row.series || '',
    accessKey: row.access_key || '',
    protocol: row.protocol || '',
    authorizedAt: row.authorized_at || '',
    xmlUrl: row.xml_url || '',
    pdfUrl: row.pdf_url || '',
    errorMessage: row.error_message || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNfseDocuments(auth?: AuthContext) {
  const rows = await listTenantNfseDocuments(auth?.tenantId);
  return rows.map(mapNfseDocumentRow);
}

export async function createNfseDocument(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const companyId = normalizeOptionalText(body.companyId as string) || '';
  const competenceMonth = normalizeOptionalText(body.competenceMonth as string);
  const serviceDescription = normalizeRequiredText(body.serviceDescription as string);

  if (!isValidUuid(companyId)) {
    throw validationError('Selecione o tomador (cliente) da NFS-e.', 'invalid_nfse_company', 'companyId');
  }
  if (competenceMonth && !/^\d{4}-\d{2}$/.test(competenceMonth)) {
    throw validationError('Informe a competencia no formato AAAA-MM.', 'invalid_nfse_competence', 'competenceMonth');
  }
  const serviceAmount = Number(body.serviceAmount);
  if (!Number.isFinite(serviceAmount) || serviceAmount <= 0) {
    throw validationError('Informe o valor do servico.', 'invalid_nfse_amount', 'serviceAmount');
  }

  const company = await findCompanyForNfse(companyId, auth?.tenantId);
  if (!company) {
    throw validationError('Tomador nao encontrado para esta transportadora.', 'invalid_nfse_company', 'companyId');
  }

  const config = await findTenantNfseConfig(auth?.tenantId);
  const issRate = config?.iss_rate !== null && config?.iss_rate !== undefined ? Number(config.iss_rate) : null;

  const row = await insertTenantNfseDocument(
    {
      companyId,
      reference: `nfse-${randomUUID()}`,
      competenceMonth,
      serviceAmount: Number(serviceAmount.toFixed(2)),
      serviceDescription: serviceDescription || config?.default_service_description || '',
      issRate,
      issRetained: config?.iss_retained ?? false,
      requestPayload: {},
      provider: null,
    },
    auth?.tenantId,
    auth?.userId,
  );

  return row ? mapNfseDocumentRow(row) : null;
}

async function buildEmitInput(documentRow: NfseDocumentRow, tenantId?: string): Promise<NfseEmitInput> {
  const emitter = await findTenantEmitter(tenantId);
  const config = await findTenantNfseConfig(tenantId);
  if (!emitter?.cnpj) {
    throw validationError('Cadastro fiscal da transportadora incompleto (CNPJ).', 'nfse_emitter_incomplete', 'emitter');
  }
  if (!emitter.municipal_registration) {
    throw validationError('Informe a inscricao municipal da transportadora no perfil fiscal.', 'nfse_emitter_municipal_registration', 'emitter');
  }
  if (!config || !config.enabled) {
    throw validationError('Configure e ative a NFS-e antes de emitir (Configuracao NFS-e).', 'nfse_config_disabled', 'config');
  }
  if (!config.service_code || config.iss_rate === null || config.iss_rate === undefined) {
    throw validationError('Configure o codigo de tributacao e a aliquota do ISS.', 'nfse_config_incomplete', 'config');
  }

  if (!documentRow.company_id) {
    throw validationError('NFS-e sem tomador vinculado.', 'nfse_company_missing', 'companyId');
  }
  const company = await findCompanyForNfse(documentRow.company_id, tenantId);
  if (!company) {
    throw validationError('Tomador da NFS-e nao encontrado.', 'invalid_nfse_company', 'companyId');
  }

  const prestadorIbge = config.municipal_incidence_ibge || emitter.ibge_code || '';

  return {
    reference: documentRow.reference,
    issueDate: new Date().toISOString().slice(0, 10),
    prestador: {
      cnpj: (emitter.cnpj || '').replace(/\D/g, ''),
      municipalRegistration: emitter.municipal_registration || '',
      cityIbgeCode: prestadorIbge,
    },
    tomador: {
      document: company.cnpj || '',
      name: company.corporate_name || '',
      email: company.email || undefined,
      municipalRegistration: company.municipal_registration || undefined,
      street: company.address || undefined,
      district: undefined,
      cityIbgeCode: company.ibge_code || undefined,
      state: company.state || undefined,
      zipCode: company.zip_code || undefined,
    },
    servico: {
      issRate: documentRow.iss_rate !== null && documentRow.iss_rate !== undefined ? Number(documentRow.iss_rate) : Number(config.iss_rate),
      description: documentRow.service_description || config.default_service_description || '',
      issRetained: documentRow.iss_retained,
      serviceListItem: config.service_list_item || '',
      serviceCode: config.service_code || '',
      cnaeCode: config.cnae_code || '',
      amount: Number(documentRow.service_amount || 0),
      cityIbgeCode: config.municipal_incidence_ibge || prestadorIbge,
    },
  };
}

export async function emitNfseDocument(auth: AuthContext | undefined, id: string) {
  const documentRow = await findTenantNfseDocument(id, auth?.tenantId);
  if (!documentRow) return { status: 'not_found' as const };
  if (!['draft', 'rejected', 'error'].includes(documentRow.status)) {
    throw validationError('Esta NFS-e ja foi enviada.', 'nfse_already_sent', 'status');
  }

  const input = await buildEmitInput(documentRow, auth?.tenantId);
  const adapter = getNfseProviderAdapter();
  const requestPayload = mapNfseFocusPayload(input);

  try {
    const response = await adapter.emit(input);
    const updated = await updateNfseDocumentAfterProvider(
      id,
      {
        status: response.status,
        provider: response.provider,
        providerDocumentId: response.providerDocumentId,
        accessKey: response.accessKey,
        protocol: response.protocol,
        authorizedAt: response.authorizedAt,
        number: response.number,
        series: response.series,
        xmlUrl: response.xmlUrl,
        pdfUrl: response.pdfUrl,
        responsePayload: { request: requestPayload, response: response.responsePayload },
        errorMessage: null,
      },
      auth?.tenantId,
      auth?.userId,
    );
    return { status: 'ok' as const, document: updated ? mapNfseDocumentRow(updated) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha ao emitir NFS-e.';
    const updated = await updateNfseDocumentAfterProvider(
      id,
      { status: 'error', responsePayload: { request: requestPayload }, errorMessage: message },
      auth?.tenantId,
      auth?.userId,
    );
    return { status: 'ok' as const, document: updated ? mapNfseDocumentRow(updated) : null };
  }
}

export async function syncNfseDocument(auth: AuthContext | undefined, id: string) {
  const documentRow = await findTenantNfseDocument(id, auth?.tenantId);
  if (!documentRow) return { status: 'not_found' as const };
  if (documentRow.status === 'draft') {
    throw validationError('Emita a NFS-e antes de sincronizar.', 'nfse_not_sent', 'status');
  }

  const adapter = getNfseProviderAdapter();
  const response = await adapter.consult(documentRow.reference);
  const updated = await updateNfseDocumentAfterProvider(
    id,
    {
      status: response.status,
      provider: response.provider,
      providerDocumentId: response.providerDocumentId,
      accessKey: response.accessKey,
      protocol: response.protocol,
      authorizedAt: response.authorizedAt,
      number: response.number,
      series: response.series,
      xmlUrl: response.xmlUrl,
      pdfUrl: response.pdfUrl,
      responsePayload: { response: response.responsePayload },
      errorMessage: response.status === 'rejected' ? 'NFS-e rejeitada. Verifique os dados.' : null,
    },
    auth?.tenantId,
    auth?.userId,
  );
  return { status: 'ok' as const, document: updated ? mapNfseDocumentRow(updated) : null };
}

export async function deleteNfseDocument(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantNfseDocument(id, auth?.tenantId);
  return Boolean(row);
}
