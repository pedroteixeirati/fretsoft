import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { isValidCnpj, isValidCpf, normalizeDocumentNumber, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import type {
  TransportPartnerInput,
  TransportPartnerPayload,
  TransportPartnerRow,
  TransportPartnerStatus,
  TransportPartnerType,
} from '../dtos/transport-partner.types';
import { transportPartnerErrors } from '../errors/transport-partners.errors';
import {
  deleteTenantTransportPartner,
  findTenantTransportPartner,
  findTransportPartnerByDocument,
  insertTenantTransportPartner,
  listTenantTransportPartners,
  updateTenantTransportPartner,
} from '../repositories/transport-partners.repository';

export const transportPartnersPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'financial', 'operational'],
  update: ['dev', 'owner', 'admin', 'financial', 'operational'],
  delete: ['dev', 'owner', 'admin', 'financial'],
};

const partnerTypes: TransportPartnerType[] = ['tac', 'agregado'];
const partnerStatuses: TransportPartnerStatus[] = ['active', 'inactive'];

function isValidPartnerDocument(document: string) {
  // CPF: 11 digitos numericos. CNPJ: 14 caracteres (numerico valido ou alfanumerico).
  if (document.length === 11) return /^\d{11}$/.test(document) && isValidCpf(document);
  if (document.length === 14) return /^\d{14}$/.test(document) ? isValidCnpj(document) : /^[0-9A-Z]{14}$/.test(document);
  return false;
}

function mapPartnerRow(row: TransportPartnerRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    name: row.name,
    documentNumber: row.document_number,
    partnerType: row.partner_type,
    rntrc: row.rntrc || '',
    bankName: row.bank_name || '',
    bankBranch: row.bank_branch || '',
    bankAccount: row.bank_account || '',
    bankAccountType: row.bank_account_type || '',
    pixKey: row.pix_key || '',
    pixKeyType: row.pix_key_type || '',
    status: row.status,
    notes: row.notes || '',
  };
}

export function validateTransportPartnerPayload(body: TransportPartnerInput): TransportPartnerPayload {
  const name = normalizeRequiredText(body.name);
  const documentNumber = normalizeDocumentNumber(body.documentNumber);
  const partnerType = (normalizeOptionalText(body.partnerType as string) || 'tac') as TransportPartnerType;
  const rntrc = (normalizeOptionalText(body.rntrc) || '').replace(/\D/g, '');
  const status = (normalizeOptionalText(body.status as string) || 'active') as TransportPartnerStatus;

  if (name.length < 2) throw transportPartnerErrors.invalidName();
  if (!isValidPartnerDocument(documentNumber)) throw transportPartnerErrors.invalidDocument();
  if (!partnerTypes.includes(partnerType)) throw transportPartnerErrors.invalidType();
  if (rntrc && (rntrc.length < 8 || rntrc.length > 12)) throw transportPartnerErrors.invalidRntrc();
  if (!partnerStatuses.includes(status)) throw transportPartnerErrors.invalidStatus();

  return {
    name,
    documentNumber,
    partnerType,
    rntrc,
    bankName: normalizeOptionalText(body.bankName) || '',
    bankBranch: normalizeOptionalText(body.bankBranch) || '',
    bankAccount: normalizeOptionalText(body.bankAccount) || '',
    bankAccountType: normalizeOptionalText(body.bankAccountType) || '',
    pixKey: normalizeOptionalText(body.pixKey) || '',
    pixKeyType: normalizeOptionalText(body.pixKeyType) || '',
    status,
    notes: normalizeOptionalText(body.notes) || '',
  };
}

export async function listTransportPartners(auth?: AuthContext) {
  if (!auth?.tenantId) return [];
  const rows = await listTenantTransportPartners(auth.tenantId);
  return rows.map(mapPartnerRow);
}

export async function createTransportPartner(auth: AuthContext | undefined, body: TransportPartnerInput) {
  const tenantId = auth?.tenantId || '';
  const payload = validateTransportPartnerPayload(body);
  if (await findTransportPartnerByDocument(payload.documentNumber, tenantId)) {
    throw transportPartnerErrors.duplicatedDocument();
  }
  const row = await insertTenantTransportPartner(payload, tenantId, auth?.userId);
  return row ? mapPartnerRow(row) : null;
}

export async function updateTransportPartner(auth: AuthContext | undefined, id: string, body: TransportPartnerInput) {
  const tenantId = auth?.tenantId || '';
  const payload = validateTransportPartnerPayload(body);
  if (await findTransportPartnerByDocument(payload.documentNumber, tenantId, id)) {
    throw transportPartnerErrors.duplicatedDocument();
  }
  const row = await updateTenantTransportPartner(id, payload, tenantId, auth?.userId);
  if (!row) return undefined;
  return mapPartnerRow(row);
}

export async function deleteTransportPartner(auth: AuthContext | undefined, id: string) {
  const tenantId = auth?.tenantId || '';
  const partner = await findTenantTransportPartner(id, tenantId);
  if (!partner) return false;
  const deleted = await deleteTenantTransportPartner(id, tenantId);
  return Boolean(deleted);
}
