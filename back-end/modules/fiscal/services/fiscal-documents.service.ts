import {
  isPositiveNumber,
  isValidDate,
  isValidState,
  isValidUuid,
  normalizeDocumentNumber,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import { findTenantFreightById } from '../../freights/repositories/freights.repository';
import { findTenantTransportPartner } from '../../transport-partners/repositories/transport-partners.repository';
import type {
  FiscalDocumentInput,
  FiscalDocumentPayload,
  FiscalDocumentRow,
  FiscalDocumentStatus,
  FiscalDocumentType,
  FiscalExecutionMode,
  FiscalPartyInput,
  FiscalPartyPayload,
  FiscalPartyRole,
  FiscalPartyRow,
  FiscalPaymentComponent,
  FiscalPaymentInput,
  FiscalPaymentPayload,
  FiscalPaymentRow,
} from '../dtos/fiscal-document.types';
import { fiscalErrors } from '../errors/fiscal.errors';
import {
  createTenantFiscalDocument,
  createFiscalCommunicationLog,
  deleteTenantFiscalDocument,
  findFiscalDocumentByAccessKey,
  findFiscalDocumentBySourceFreight,
  findFiscalDocumentDuplicate,
  findTenantFiscalDocument,
  listFiscalDocumentParties,
  listFiscalDocumentPayments,
  listTenantFiscalDocuments as listTenantFiscalDocumentRows,
  updateFiscalDocumentAfterProviderAttempt,
  updateTenantFiscalDocument,
} from '../repositories/fiscal-documents.repository';
import {
  buildFiscalProviderRequest,
  getFiscalProviderAdapter,
  serializeFiscalProviderRequest,
} from './fiscal-provider.service';

const documentTypes: FiscalDocumentType[] = ['cte', 'cte_os', 'mdfe'];
const statuses: FiscalDocumentStatus[] = ['draft', 'processing', 'authorized', 'rejected', 'canceled', 'denied', 'inutilized', 'error'];
const partyRoles: FiscalPartyRole[] = ['taker', 'sender', 'recipient', 'dispatcher', 'receiver'];
const executionModes: FiscalExecutionMode[] = ['own_fleet', 'third_party'];
const paymentComponents: FiscalPaymentComponent[] = ['01', '02', '03', '04'];

function mapPaymentRow(row: FiscalPaymentRow) {
  return {
    id: row.id,
    displayId: row.display_id ?? undefined,
    payeeName: row.payee_name || '',
    payeeDocument: row.payee_document || '',
    componentType: row.component_type,
    amount: Number(row.amount || 0),
    bankName: row.bank_name || '',
    bankBranch: row.bank_branch || '',
    bankAccount: row.bank_account || '',
    pixKey: row.pix_key || '',
  };
}

function normalizePayment(payment: FiscalPaymentInput, index: number): FiscalPaymentPayload {
  const componentType = (normalizeOptionalText(payment.componentType as string) || '04') as FiscalPaymentComponent;
  const amount = Number(payment.amount);

  if (!paymentComponents.includes(componentType)) {
    throw fiscalErrors.invalidPaymentComponent(index);
  }
  if (!isPositiveNumber(amount)) {
    throw fiscalErrors.invalidPaymentAmount(index);
  }

  return {
    payeeName: normalizeOptionalText(payment.payeeName) || '',
    payeeDocument: normalizeDocumentNumber(payment.payeeDocument),
    componentType,
    amount,
    bankName: normalizeOptionalText(payment.bankName) || '',
    bankBranch: normalizeOptionalText(payment.bankBranch) || '',
    bankAccount: normalizeOptionalText(payment.bankAccount) || '',
    pixKey: normalizeOptionalText(payment.pixKey) || '',
  };
}

function normalizeDigits(value?: string | null) {
  return (value || '').replace(/\D/g, '');
}

function normalizeJsonObject(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

function normalizeAuthorizedAt(value?: string | null) {
  const normalized = normalizeOptionalText(value);
  if (!normalized) return '';

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw fiscalErrors.invalidAuthorizedAt();
  }

  return parsed.toISOString();
}

function mapPartyRow(row: FiscalPartyRow) {
  return {
    id: row.id,
    displayId: row.display_id ?? undefined,
    role: row.role,
    name: row.name,
    documentNumber: row.document_number || '',
    stateRegistration: row.state_registration || '',
    city: row.city || '',
    state: row.state || '',
  };
}

function mapDocumentRow(row: FiscalDocumentRow, parties: FiscalPartyRow[] = [], payments: FiscalPaymentRow[] = []) {
  return {
    id: row.id,
    displayId: row.display_id ?? undefined,
    documentType: row.document_type,
    model: row.model,
    series: row.series,
    number: row.number,
    accessKey: row.access_key || '',
    status: row.status,
    issueDate: row.issue_date,
    dueDate: row.due_date || '',
    amount: Number(row.amount),
    originName: row.origin_name || '',
    destinationName: row.destination_name || '',
    takerName: row.taker_name || '',
    protocol: row.protocol || '',
    authorizedAt: row.authorized_at || '',
    xml: row.xml || '',
    dacteUrl: row.dacte_url || '',
    provider: row.provider || '',
    providerDocumentId: row.provider_document_id || '',
    idempotencyKey: row.idempotency_key || '',
    taxData: row.tax_data || {},
    emitterSnapshot: row.emitter_snapshot || {},
    notes: row.notes || '',
    sourceFreightId: row.source_freight_id || '',
    executionMode: row.execution_mode || 'own_fleet',
    ciot: row.ciot || '',
    rntrc: row.rntrc || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parties: parties.map(mapPartyRow),
    payments: payments.map(mapPaymentRow),
  };
}

function normalizeParty(party: FiscalPartyInput): FiscalPartyPayload {
  const role = normalizeOptionalText(String(party.role || '')) as FiscalPartyRole | null;
  const name = normalizeRequiredText(party.name);
  const state = (normalizeOptionalText(party.state)?.toUpperCase() || '');

  if (!role || !partyRoles.includes(role)) throw fiscalErrors.invalidPartyRole();
  if (name.length < 2) throw fiscalErrors.invalidPartyName();
  if (state && !isValidState(state)) throw fiscalErrors.invalidPartyState();

  return {
    role,
    name,
    documentNumber: normalizeDocumentNumber(party.documentNumber),
    stateRegistration: normalizeOptionalText(party.stateRegistration) || '',
    city: normalizeOptionalText(party.city) || '',
    state,
  };
}

export async function validateFiscalDocumentPayload(body: FiscalDocumentInput): Promise<FiscalDocumentPayload> {
  const documentType = (normalizeOptionalText(body.documentType) || 'cte') as FiscalDocumentType;
  const model = normalizeOptionalText(body.model) || (documentType === 'mdfe' ? '58' : '57');
  const series = normalizeRequiredText(body.series);
  const number = normalizeRequiredText(body.number);
  const accessKey = normalizeDigits(body.accessKey);
  const status = (normalizeOptionalText(body.status) || 'draft') as FiscalDocumentStatus;
  const issueDate = normalizeRequiredText(body.issueDate);
  const dueDate = normalizeOptionalText(body.dueDate) || '';
  const amount = Number(body.amount ?? 0);
  const parties = Array.isArray(body.parties) ? body.parties.map(normalizeParty) : [];

  if (!documentTypes.includes(documentType)) throw fiscalErrors.invalidDocumentType();
  if (!/^\d{2}$/.test(model)) throw fiscalErrors.invalidModel();
  if (!/^[0-9A-Za-z-]{1,10}$/.test(series)) throw fiscalErrors.invalidSeries();
  if (!/^[0-9A-Za-z-]{1,20}$/.test(number)) throw fiscalErrors.invalidNumber();
  const sourceFreightId = normalizeOptionalText(body.sourceFreightId) || '';
  if (sourceFreightId && !isValidUuid(sourceFreightId)) throw fiscalErrors.invalidSourceFreight();

  const executionMode = (normalizeOptionalText(body.executionMode as string) || 'own_fleet') as FiscalExecutionMode;
  if (!executionModes.includes(executionMode)) throw fiscalErrors.invalidExecutionMode();
  const ciot = (normalizeOptionalText(body.ciot) || '').replace(/\D/g, '');
  const rntrc = (normalizeOptionalText(body.rntrc) || '').replace(/\D/g, '');
  const payments = Array.isArray(body.payments) ? body.payments.map(normalizePayment) : [];

  // Regra fiscal: frete de terceiro (TAC) exige CIOT, RNTRC e ao menos um pagamento de frete (componente 04).
  if (executionMode === 'third_party') {
    if (!ciot) throw fiscalErrors.ciotRequiredForThirdParty();
    if (!rntrc) throw fiscalErrors.rntrcRequiredForThirdParty();
    if (!payments.some((payment) => payment.componentType === '04')) throw fiscalErrors.paymentRequiredForThirdParty();
  }

  if (accessKey && !/^\d{44}$/.test(accessKey)) throw fiscalErrors.invalidAccessKey();
  if (!statuses.includes(status)) throw fiscalErrors.invalidStatus();
  if (!isValidDate(issueDate)) throw fiscalErrors.invalidIssueDate();
  if (dueDate && !isValidDate(dueDate)) throw fiscalErrors.invalidDueDate();
  if (!isPositiveNumber(amount)) throw fiscalErrors.invalidAmount();

  return {
    documentType,
    model,
    series,
    number,
    accessKey,
    status,
    issueDate,
    dueDate,
    amount,
    originName: normalizeOptionalText(body.originName) || '',
    destinationName: normalizeOptionalText(body.destinationName) || '',
    takerName: normalizeOptionalText(body.takerName) || '',
    protocol: normalizeOptionalText(body.protocol) || '',
    authorizedAt: normalizeAuthorizedAt(body.authorizedAt),
    xml: normalizeOptionalText(body.xml) || '',
    dacteUrl: normalizeOptionalText(body.dacteUrl) || '',
    provider: normalizeOptionalText(body.provider) || '',
    providerDocumentId: normalizeOptionalText(body.providerDocumentId) || '',
    idempotencyKey: normalizeOptionalText(body.idempotencyKey) || '',
    taxData: normalizeJsonObject(body.taxData),
    emitterSnapshot: normalizeJsonObject(body.emitterSnapshot),
    notes: normalizeOptionalText(body.notes) || '',
    sourceFreightId: sourceFreightId || null,
    executionMode,
    ciot,
    rntrc,
    payments,
    parties,
  };
}

export async function listTenantFiscalDocuments(tenantId?: string) {
  const rows = await listTenantFiscalDocumentRows(tenantId);
  return rows.map((row) => mapDocumentRow(row));
}

export async function getFiscalDocument(id: string, tenantId?: string) {
  const row = await findTenantFiscalDocument(id, tenantId);
  if (!row) return null;

  const parties = await listFiscalDocumentParties(id, tenantId);
  const payments = await listFiscalDocumentPayments(id, tenantId);
  return mapDocumentRow(row, parties, payments);
}

const editableStatuses: FiscalDocumentStatus[] = ['draft', 'rejected', 'error'];

export async function createFiscalDocument(tenantId: string | undefined, userId: string | undefined, body: FiscalDocumentInput) {
  const payload = await validateFiscalDocumentPayload(body);
  if (await findFiscalDocumentDuplicate(payload, tenantId)) throw fiscalErrors.duplicatedDocument();
  if (payload.accessKey && await findFiscalDocumentByAccessKey(payload.accessKey, tenantId)) throw fiscalErrors.duplicatedAccessKey();
  // Idempotencia: um frete nao pode gerar dois documentos fiscais ativos.
  if (payload.sourceFreightId && await findFiscalDocumentBySourceFreight(payload.sourceFreightId, tenantId)) {
    throw fiscalErrors.duplicatedSourceFreight();
  }

  // Status nunca vem do cliente: documento sempre nasce em rascunho e so muda via emit/sync.
  const row = await createTenantFiscalDocument({ ...payload, status: 'draft' }, tenantId, userId);
  return row ? getFiscalDocument(row.id, tenantId) : null;
}

export async function buildFiscalDraftFromFreight(freightId: string, tenantId: string | undefined) {
  const freight = await findTenantFreightById(freightId, tenantId || '');
  if (!freight) return null;

  const existing = await findFiscalDocumentBySourceFreight(freight.id, tenantId);
  const partner = freight.transport_partner_id ? await findTenantTransportPartner(freight.transport_partner_id, tenantId || '') : null;
  const amount = Number(freight.amount || 0);

  return {
    existingDocumentId: existing?.id || null,
    draft: {
      documentType: 'cte' as FiscalDocumentType,
      model: '57',
      issueDate: freight.date || '',
      dueDate: '',
      amount,
      originName: freight.origin || '',
      destinationName: freight.destination || '',
      takerName: freight.contract_name || '',
      executionMode: freight.execution_mode || 'own_fleet',
      transportPartnerId: freight.transport_partner_id || '',
      ciot: '',
      rntrc: partner?.rntrc || '',
      sourceFreightId: freight.id,
      payments: partner
        ? [{
            payeeName: partner.name,
            payeeDocument: partner.document_number,
            componentType: '04',
            amount,
            bankName: partner.bank_name || '',
            bankBranch: partner.bank_branch || '',
            bankAccount: partner.bank_account || '',
            pixKey: partner.pix_key || '',
          }]
        : [],
    },
  };
}

export async function updateFiscalDocument(id: string, tenantId: string | undefined, userId: string | undefined, body: FiscalDocumentInput) {
  const current = await findTenantFiscalDocument(id, tenantId);
  if (!current) return null;
  if (!editableStatuses.includes(current.status)) {
    throw fiscalErrors.documentNotEditable();
  }

  const payload = await validateFiscalDocumentPayload(body);
  if (await findFiscalDocumentDuplicate(payload, tenantId, id)) throw fiscalErrors.duplicatedDocument();
  if (payload.accessKey && await findFiscalDocumentByAccessKey(payload.accessKey, tenantId, id)) throw fiscalErrors.duplicatedAccessKey();

  // Preserva o status atual; edicao manual nunca altera o estado fiscal.
  const row = await updateTenantFiscalDocument(id, { ...payload, status: current.status }, tenantId, userId);
  return row ? getFiscalDocument(row.id, tenantId) : null;
}

export async function removeFiscalDocument(id: string, tenantId?: string) {
  const deleted = await deleteTenantFiscalDocument(id, tenantId);
  return !!deleted;
}

export async function emitFiscalDocument(id: string, tenantId: string | undefined, userId: string | undefined) {
  const document = await findTenantFiscalDocument(id, tenantId);
  if (!document) return null;
  if (!['draft', 'rejected', 'error'].includes(document.status)) {
    throw fiscalErrors.documentNotEmittable();
  }

  const parties = await listFiscalDocumentParties(id, tenantId);
  const payments = await listFiscalDocumentPayments(id, tenantId);
  const request = buildFiscalProviderRequest(document, parties, payments);
  const requestPayload = serializeFiscalProviderRequest(request);
  const startedAt = Date.now();
  let providerName = document.provider || 'unconfigured';

  try {
    const provider = getFiscalProviderAdapter();
    providerName = provider.name;
    const response = await provider.emitDocument(request);
    const durationMs = Date.now() - startedAt;

    await createFiscalCommunicationLog({
      tenantId,
      fiscalDocumentId: id,
      provider: providerName,
      operation: request.operation,
      requestPayload,
      responsePayload: response.responsePayload || {},
      httpStatus: response.httpStatus || null,
      durationMs,
    });

    await updateFiscalDocumentAfterProviderAttempt({
      id,
      tenantId,
      userId,
      provider: providerName,
      providerDocumentId: response.providerDocumentId,
      status: response.status,
      accessKey: response.accessKey,
      protocol: response.protocol,
      authorizedAt: response.authorizedAt,
      xml: response.xml,
      dacteUrl: response.dacteUrl,
    });

    return getFiscalDocument(id, tenantId);
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    await createFiscalCommunicationLog({
      tenantId,
      fiscalDocumentId: id,
      provider: providerName,
      operation: request.operation,
      requestPayload,
      responsePayload: {},
      errorMessage: error instanceof Error ? error.message : 'Falha desconhecida na emissao fiscal.',
      durationMs,
    });
    throw error;
  }
}

export async function syncFiscalDocument(id: string, tenantId: string | undefined, userId: string | undefined) {
  const document = await findTenantFiscalDocument(id, tenantId);
  if (!document) return null;

  const parties = await listFiscalDocumentParties(id, tenantId);
  const payments = await listFiscalDocumentPayments(id, tenantId);
  const request = buildFiscalProviderRequest(document, parties, payments);
  const requestPayload = serializeFiscalProviderRequest({ ...request, operation: 'consult_document' });
  const startedAt = Date.now();
  let providerName = document.provider || 'focus_nfe';

  try {
    const provider = getFiscalProviderAdapter();
    providerName = provider.name;
    const response = await provider.consultDocument({ ...request, operation: 'consult_document' });
    const durationMs = Date.now() - startedAt;

    await createFiscalCommunicationLog({
      tenantId,
      fiscalDocumentId: id,
      provider: providerName,
      operation: 'consult_document',
      requestPayload,
      responsePayload: response.responsePayload || {},
      httpStatus: response.httpStatus || null,
      durationMs,
    });

    await updateFiscalDocumentAfterProviderAttempt({
      id,
      tenantId,
      userId,
      provider: providerName,
      providerDocumentId: response.providerDocumentId,
      status: response.status,
      accessKey: response.accessKey,
      protocol: response.protocol,
      authorizedAt: response.authorizedAt,
      xml: response.xml,
      dacteUrl: response.dacteUrl,
    });

    return getFiscalDocument(id, tenantId);
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    await createFiscalCommunicationLog({
      tenantId,
      fiscalDocumentId: id,
      provider: providerName,
      operation: 'consult_document',
      requestPayload,
      responsePayload: {},
      errorMessage: error instanceof Error ? error.message : 'Falha desconhecida ao consultar documento fiscal.',
      durationMs,
    });
    throw error;
  }
}
