import {
  isPositiveNumber,
  isValidDate,
  isValidState,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import type {
  FiscalDocumentInput,
  FiscalDocumentPayload,
  FiscalDocumentRow,
  FiscalDocumentStatus,
  FiscalDocumentType,
  FiscalPartyInput,
  FiscalPartyPayload,
  FiscalPartyRole,
  FiscalPartyRow,
} from '../dtos/fiscal-document.types';
import { fiscalErrors } from '../errors/fiscal.errors';
import {
  createTenantFiscalDocument,
  deleteTenantFiscalDocument,
  findFiscalDocumentByAccessKey,
  findFiscalDocumentDuplicate,
  findTenantFiscalDocument,
  listFiscalDocumentParties,
  listTenantFiscalDocuments as listTenantFiscalDocumentRows,
  updateTenantFiscalDocument,
} from '../repositories/fiscal-documents.repository';

const documentTypes: FiscalDocumentType[] = ['cte', 'cte_os', 'mdfe'];
const statuses: FiscalDocumentStatus[] = ['draft', 'processing', 'authorized', 'rejected', 'canceled', 'denied', 'inutilized', 'error'];
const partyRoles: FiscalPartyRole[] = ['taker', 'sender', 'recipient', 'dispatcher', 'receiver'];

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

function mapDocumentRow(row: FiscalDocumentRow, parties: FiscalPartyRow[] = []) {
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    parties: parties.map(mapPartyRow),
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
    documentNumber: normalizeDigits(party.documentNumber),
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
  return mapDocumentRow(row, parties);
}

export async function createFiscalDocument(tenantId: string | undefined, userId: string | undefined, body: FiscalDocumentInput) {
  const payload = await validateFiscalDocumentPayload(body);
  if (await findFiscalDocumentDuplicate(payload, tenantId)) throw fiscalErrors.duplicatedDocument();
  if (payload.accessKey && await findFiscalDocumentByAccessKey(payload.accessKey, tenantId)) throw fiscalErrors.duplicatedAccessKey();

  const row = await createTenantFiscalDocument(payload, tenantId, userId);
  return row ? getFiscalDocument(row.id, tenantId) : null;
}

export async function updateFiscalDocument(id: string, tenantId: string | undefined, userId: string | undefined, body: FiscalDocumentInput) {
  const payload = await validateFiscalDocumentPayload(body);
  if (await findFiscalDocumentDuplicate(payload, tenantId, id)) throw fiscalErrors.duplicatedDocument();
  if (payload.accessKey && await findFiscalDocumentByAccessKey(payload.accessKey, tenantId, id)) throw fiscalErrors.duplicatedAccessKey();

  const row = await updateTenantFiscalDocument(id, payload, tenantId, userId);
  return row ? getFiscalDocument(row.id, tenantId) : null;
}

export async function removeFiscalDocument(id: string, tenantId?: string) {
  const deleted = await deleteTenantFiscalDocument(id, tenantId);
  return !!deleted;
}
