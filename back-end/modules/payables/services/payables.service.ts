import type { PayableInput, PayableInvoiceStatus, PayablePayload, PayableRow, PayableSourceType, PayableStatus } from '../dtos/payable.types';
import type { ExpenseSeed } from '../../expenses/dtos/expense.types';
import {
  isPositiveNumber,
  isValidDate,
  isValidUuid,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import { payableErrors } from '../errors/payables.errors';
import {
  createTenantPayable,
  deletePayableBySource,
  deleteTenantPayable,
  findTenantContractForPayable,
  findPayableBySource,
  findTenantVehicleForPayable,
  listTenantPayables as listTenantPayablesRows,
  markPayableAsOverdue,
  markPayableAsPaid,
  updateTenantPayable,
} from '../repositories/payables.repository';
import { syncExpensePayableLink } from '../../expenses/repositories/expenses.repository';

function isValidProofUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function mapPayableRow(row: PayableRow) {
  return {
    id: row.id,
    displayId: row.display_id ?? undefined,
    sourceType: row.source_type,
    sourceId: row.source_id,
    description: row.description,
    providerName: row.provider_name || '',
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name || '',
    contractId: row.contract_id,
    amount: Number(row.amount),
    dueDate: row.due_date,
    status: row.status,
    paidAt: row.paid_at || '',
    paymentMethod: row.payment_method || '',
    proofUrl: row.proof_url || '',
    notes: row.notes || '',
    documentNumber: row.document_number || '',
    invoiceNumber: row.invoice_number || '',
    invoiceStatus: row.invoice_status || 'not_informed',
    referenceMonth: row.reference_month || '',
    importBatchId: row.import_batch_id,
    importSheetName: row.import_sheet_name || '',
    importRowNumber: row.import_row_number,
  };
}

function normalizeOptionalField(value: unknown) {
  if (value === null || value === undefined) return '';
  return normalizeOptionalText(String(value)) || '';
}

export async function validatePayablePayload(body: PayableInput, tenantId: string): Promise<PayablePayload> {
  const sourceType = (normalizeOptionalText(body.sourceType) || 'manual') as PayableSourceType;
  const sourceId = normalizeOptionalText(body.sourceId);
  const description = normalizeRequiredText(body.description);
  const providerName = normalizeOptionalText(body.providerName) || '';
  const vehicleId = normalizeOptionalText(body.vehicleId);
  const contractId = normalizeOptionalText(body.contractId);
  const amount = Number(body.amount ?? 0);
  const dueDate = normalizeRequiredText(body.dueDate);
  let status = ((normalizeOptionalText(body.status) || 'open') as PayableStatus);
  let paidAt = normalizeOptionalText(body.paidAt) || '';
  const paymentMethod = normalizeOptionalText(body.paymentMethod) || '';
  const proofUrl = normalizeOptionalText(body.proofUrl) || '';
  const notes = normalizeOptionalText(body.notes) || '';
  const documentNumber = normalizeOptionalField(body.documentNumber);
  const invoiceNumber = normalizeOptionalField(body.invoiceNumber);
  let invoiceStatus = (normalizeOptionalField(body.invoiceStatus) || 'not_informed') as PayableInvoiceStatus;
  const referenceMonth = normalizeOptionalField(body.referenceMonth);
  const importBatchId = normalizeOptionalField(body.importBatchId);
  const importSheetName = normalizeOptionalField(body.importSheetName);
  const importRowNumberValue = body.importRowNumber === null || body.importRowNumber === undefined || body.importRowNumber === ''
    ? null
    : Number(body.importRowNumber);

  if (!['expense', 'manual'].includes(sourceType)) throw payableErrors.invalidSourceType();
  if (sourceType === 'expense' && !sourceId) throw payableErrors.expenseSourceRequiresId();
  if (sourceId && !isValidUuid(sourceId)) throw payableErrors.invalidSourceId();
  if (description.length < 3) throw payableErrors.invalidDescription();
  if (providerName && providerName.length < 2) throw payableErrors.invalidProviderName();
  if (!isPositiveNumber(amount)) throw payableErrors.invalidAmount();
  if (!isValidDate(dueDate)) throw payableErrors.invalidDueDate();
  if (!['open', 'paid', 'overdue', 'canceled'].includes(status)) throw payableErrors.invalidStatus();
  if (paidAt && !isValidDate(paidAt)) throw payableErrors.invalidPaidAt();
  if (proofUrl && !isValidProofUrl(proofUrl)) throw payableErrors.invalidProofUrl();
  if (!['informed', 'missing', 'not_informed'].includes(invoiceStatus)) throw payableErrors.invalidInvoiceStatus();
  if (referenceMonth && !/^\d{4}-\d{2}$/.test(referenceMonth)) throw payableErrors.invalidReferenceMonth();
  if (importBatchId && !isValidUuid(importBatchId)) throw payableErrors.invalidImportBatch();
  if (importRowNumberValue !== null && (!Number.isInteger(importRowNumberValue) || importRowNumberValue <= 0)) {
    throw payableErrors.invalidImportRowNumber();
  }
  if (vehicleId && !isValidUuid(vehicleId)) throw payableErrors.invalidVehicle();
  if (contractId && !isValidUuid(contractId)) throw payableErrors.invalidContract();

  let vehicleName = '';
  if (vehicleId) {
    const vehicle = await findTenantVehicleForPayable(vehicleId, tenantId);
    if (!vehicle) throw payableErrors.vehicleNotFound();
    vehicleName = vehicle.name;
  }

  if (contractId) {
    const contract = await findTenantContractForPayable(contractId, tenantId);
    if (!contract) throw payableErrors.contractNotFound();
  }

  if (status === 'paid' && !paidAt) {
    paidAt = dueDate;
  }

  if (status !== 'paid' && paidAt) {
    status = 'paid';
  }

  if (invoiceNumber && invoiceStatus === 'not_informed') {
    invoiceStatus = invoiceNumber.toUpperCase().includes('SEM') ? 'missing' : 'informed';
  }

  return {
    sourceType,
    sourceId: sourceId || null,
    description,
    providerName,
    vehicleId: vehicleId || null,
    vehicleName,
    contractId: contractId || null,
    amount,
    dueDate,
    status,
    paidAt,
    paymentMethod,
    proofUrl,
    notes,
    documentNumber,
    invoiceNumber,
    invoiceStatus,
    referenceMonth,
    importBatchId: importBatchId || null,
    importSheetName,
    importRowNumber: importRowNumberValue,
  };
}

export async function listTenantPayables(tenantId?: string) {
  const rows = await listTenantPayablesRows(tenantId);
  return rows.map(mapPayableRow);
}

export async function createPayable(tenantId: string | undefined, userId: string | undefined, body: PayableInput) {
  const payload = await validatePayablePayload(body, tenantId || '');
  const row = await createTenantPayable(payload, tenantId, userId);
  return row ? mapPayableRow(row) : null;
}

export async function updatePayable(id: string, tenantId: string | undefined, userId: string | undefined, body: PayableInput) {
  const payload = await validatePayablePayload(body, tenantId || '');
  const row = await updateTenantPayable(id, payload, tenantId, userId);
  return row ? mapPayableRow(row) : null;
}

export async function removePayable(id: string, tenantId?: string) {
  const deleted = await deleteTenantPayable(id, tenantId);
  return deleted ? true : false;
}

export async function payPayable(id: string, tenantId?: string, userId?: string) {
  const row = await markPayableAsPaid(id, tenantId, userId);
  if (row?.source_type === 'expense' && row.source_id && tenantId) {
    await syncExpensePayableLink(row.source_id, tenantId, row.id, 'paid', row.paid_at || '');
  }
  return row ? mapPayableRow(row) : null;
}

export async function overduePayable(id: string, tenantId?: string, userId?: string) {
  const row = await markPayableAsOverdue(id, tenantId, userId);
  if (row?.source_type === 'expense' && row.source_id && tenantId) {
    await syncExpensePayableLink(row.source_id, tenantId, row.id, 'overdue');
  }
  return row ? mapPayableRow(row) : null;
}

function buildExpensePayableInput(expense: ExpenseSeed): PayableInput {
  return {
    sourceType: 'expense',
    sourceId: expense.id,
    description: `${expense.category} - ${expense.provider}`,
    providerName: expense.provider,
    vehicleId: expense.vehicleId,
    contractId: expense.contractId,
    amount: expense.amount,
    dueDate: expense.dueDate || expense.costDate || expense.date,
    status: expense.financialStatus === 'none' ? 'open' : expense.financialStatus,
    paidAt: expense.paidAt || '',
    proofUrl: expense.receiptUrl || '',
    notes: expense.observations || '',
  };
}

export async function syncExpensePayable(expense: ExpenseSeed, tenantId?: string, userId?: string) {
  if (!tenantId) {
    return null;
  }

  if (!expense.paymentRequired) {
    await deletePayableBySource('expense', expense.id, tenantId);
    await syncExpensePayableLink(expense.id, tenantId, null, 'none');
    return null;
  }

  const payload = await validatePayablePayload(buildExpensePayableInput(expense), tenantId);
  const existing = await findPayableBySource('expense', expense.id, tenantId);
  const row = existing
    ? await updateTenantPayable(existing.id, payload, tenantId, userId)
    : await createTenantPayable(payload, tenantId, userId);

  if (!row) {
    return null;
  }

  await syncExpensePayableLink(expense.id, tenantId, row.id, row.status, row.paid_at || '');
  return mapPayableRow(row);
}

export async function removeExpensePayable(expenseId: string, tenantId?: string) {
  if (!tenantId) {
    return;
  }

  await deletePayableBySource('expense', expenseId, tenantId);
  await syncExpensePayableLink(expenseId, tenantId, null, 'none');
}
