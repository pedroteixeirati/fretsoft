import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidUuid, normalizeOptionalText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { findTenantFiscalDocument } from '../repositories/fiscal-documents.repository';
import {
  listTenantNfeReceipts,
  upsertTenantNfeReceipt,
  updateTenantNfeReceiptStatus,
} from '../repositories/fiscal-nfe-receipts.repository';
import type { FiscalNfeReceiptRow, FiscalNfeReceiptSource, FiscalNfeReceiptStatus } from '../dtos/fiscal-nfe-receipt.types';
import { parseNfeXml } from '../utils/nfe-xml-parser';

export const fiscalNfeReceiptPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'financial', 'operational'],
  update: ['dev', 'owner', 'admin', 'financial', 'operational'],
  delete: ['dev', 'owner', 'admin'],
};

const sources: FiscalNfeReceiptSource[] = ['upload', 'email', 'api', 'focus'];
const statuses: FiscalNfeReceiptStatus[] = ['pending', 'validated', 'used', 'ignored', 'error'];

export function mapNfeReceiptRow(row: FiscalNfeReceiptRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    source: row.source,
    status: row.status,
    nfeKey: row.nfe_key,
    xml: row.xml,
    senderSnapshot: row.sender_snapshot || {},
    recipientSnapshot: row.recipient_snapshot || {},
    totalsSnapshot: row.totals_snapshot || {},
    productSnapshot: row.product_snapshot || {},
    issueDate: row.issue_date || '',
    usedFiscalDocumentId: row.used_fiscal_document_id || '',
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listNfeReceipts(auth?: AuthContext) {
  const rows = await listTenantNfeReceipts(auth?.tenantId);
  return rows.map(mapNfeReceiptRow);
}

export async function importNfeReceipt(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const xml = normalizeOptionalText(body.xml as string) || '';
  const source = (normalizeOptionalText(body.source as string) || 'upload') as FiscalNfeReceiptSource;
  const notes = normalizeOptionalText(body.notes as string);

  if (!sources.includes(source)) {
    throw validationError('Informe uma origem valida para a NF-e.', 'invalid_nfe_receipt_source', 'source');
  }
  if (xml.length < 100) {
    throw validationError('Informe o XML completo da NF-e.', 'invalid_nfe_xml', 'xml');
  }
  if (xml.length > 5_000_000) {
    throw validationError('XML da NF-e acima do tamanho permitido.', 'nfe_xml_too_large', 'xml');
  }

  const parsed = parseNfeXml(xml);
  const row = await upsertTenantNfeReceipt({
    source,
    status: 'pending',
    nfeKey: parsed.nfeKey,
    xml,
    senderSnapshot: parsed.senderSnapshot,
    recipientSnapshot: parsed.recipientSnapshot,
    totalsSnapshot: parsed.totalsSnapshot,
    productSnapshot: parsed.productSnapshot,
    issueDate: parsed.issueDate,
    notes,
  }, auth?.tenantId, auth?.userId);

  return row ? mapNfeReceiptRow(row) : null;
}

export async function updateNfeReceiptStatus(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const status = normalizeOptionalText(body.status as string) as FiscalNfeReceiptStatus | null;
  const usedFiscalDocumentId = normalizeOptionalText(body.usedFiscalDocumentId as string);

  if (!status || !statuses.includes(status)) {
    throw validationError('Informe um status valido para a NF-e recebida.', 'invalid_nfe_receipt_status', 'status');
  }
  if (usedFiscalDocumentId && !isValidUuid(usedFiscalDocumentId)) {
    throw validationError('Documento fiscal usado invalido.', 'invalid_nfe_receipt_fiscal_document', 'usedFiscalDocumentId');
  }
  if (status === 'used') {
    if (!usedFiscalDocumentId) {
      throw validationError('Informe o CT-e gerado a partir desta NF-e.', 'missing_nfe_receipt_fiscal_document', 'usedFiscalDocumentId');
    }
    const document = await findTenantFiscalDocument(usedFiscalDocumentId, auth?.tenantId);
    if (!document) {
      throw validationError('Documento fiscal nao encontrado para esta transportadora.', 'invalid_nfe_receipt_fiscal_document', 'usedFiscalDocumentId');
    }
  }

  const row = await updateTenantNfeReceiptStatus(id, status, auth?.tenantId, auth?.userId, status === 'used' ? usedFiscalDocumentId : null);
  return row ? mapNfeReceiptRow(row) : undefined;
}
