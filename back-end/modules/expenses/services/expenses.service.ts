import type { ExpenseFinancialStatus, ExpenseInput, ExpensePayload } from '../dtos/expense.types';
import type { AuthContext } from '../../auth/dtos/auth-context';
import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import {
  isNonNegativeNumber,
  isPositiveNumber,
  isValidDate,
  isValidTime,
  isValidUuid,
  normalizeOptionalText,
  normalizeRequiredText,
} from '../../../shared/validation/validation';
import {
  deleteTenantExpense,
  findTenantExpenseById,
  findTenantVehicleForExpense,
  insertTenantExpense,
  listTenantExpenses,
  type ExpenseRow,
  updateTenantExpense,
} from '../repositories/expenses.repository';
import { expenseErrors } from '../errors/expenses.errors';
import { removeExpensePayable, syncExpensePayable } from '../../payables/services/payables.service';

export const expensesPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'operational'],
  update: ['dev', 'owner', 'admin', 'operational'],
  delete: ['dev', 'owner', 'admin', 'operational'],
};

function mapExpenseRow(row: ExpenseRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    date: row.date,
    time: row.time,
    costDate: row.cost_date,
    vehicleId: row.vehicle_id,
    vehicleName: row.vehicle_name,
    provider: row.provider,
    category: row.category,
    quantity: row.quantity,
    amount: Number(row.amount || 0),
    odometer: row.odometer,
    status: row.status,
    paymentRequired: row.payment_required,
    financialStatus: row.financial_status,
    dueDate: row.due_date || '',
    paidAt: row.paid_at || '',
    linkedPayableId: row.linked_payable_id,
    contractId: row.contract_id,
    freightId: row.freight_id,
    receiptUrl: row.receipt_url || '',
    observations: row.observations || '',
  };
}

function parseBooleanInput(value: ExpenseInput['paymentRequired']) {
  return value === true || value === 'true';
}

function isValidReceiptUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:', 'data:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export async function validateExpensePayload(body: ExpenseInput, tenantId: string): Promise<ExpensePayload> {
  const date = normalizeRequiredText(body.date);
  const time = normalizeRequiredText(body.time);
  const costDate = normalizeOptionalText(body.costDate) || date;
  const vehicleId = normalizeRequiredText(body.vehicleId);
  const provider = normalizeRequiredText(body.provider);
  const category = normalizeRequiredText(body.category);
  const quantity = String(body.quantity ?? '').trim();
  const amount = Number(body.amount ?? 0);
  const odometer = String(body.odometer ?? '').trim();
  const status = body.status;
  const paymentRequired = parseBooleanInput(body.paymentRequired);
  const requestedFinancialStatus = normalizeOptionalText(body.financialStatus);
  let financialStatus: ExpenseFinancialStatus = paymentRequired
    ? ((requestedFinancialStatus as ExpenseFinancialStatus | null) || 'open')
    : 'none';
  let dueDate = paymentRequired ? (normalizeOptionalText(body.dueDate) || costDate) : '';
  let paidAt = paymentRequired ? (normalizeOptionalText(body.paidAt) || '') : '';
  let linkedPayableId = paymentRequired ? (normalizeOptionalText(body.linkedPayableId) || null) : null;
  const contractId = normalizeOptionalText(body.contractId);
  const freightId = normalizeOptionalText(body.freightId);
  const receiptUrl = normalizeOptionalText(body.receiptUrl);
  const observations = normalizeOptionalText(body.observations);

  if (!isValidDate(date)) throw expenseErrors.invalidDate();
  if (!isValidTime(time)) throw expenseErrors.invalidTime();
  if (!isValidDate(costDate)) throw expenseErrors.invalidDate();
  if (!isValidUuid(vehicleId)) throw expenseErrors.invalidVehicle();
  if (provider.length < 2) throw expenseErrors.invalidProvider();
  if (category.length < 2) throw expenseErrors.invalidCategory();
  if (!isPositiveNumber(amount)) throw expenseErrors.invalidAmount();
  if (quantity && !isNonNegativeNumber(quantity)) throw expenseErrors.invalidQuantity();
  if (odometer && !isNonNegativeNumber(odometer)) throw expenseErrors.invalidOdometer();
  if (!['approved', 'review', 'pending'].includes(status)) throw expenseErrors.invalidStatus();
  if (!['none', 'open', 'paid', 'overdue', 'canceled'].includes(financialStatus)) throw expenseErrors.invalidFinancialStatus();
  if (paymentRequired && dueDate && !isValidDate(dueDate)) throw expenseErrors.invalidDueDate();
  if (paidAt && !isValidDate(paidAt)) throw expenseErrors.invalidPaidAt();
  if (linkedPayableId && !isValidUuid(linkedPayableId)) throw expenseErrors.invalidLinkedPayable();
  if (contractId && !isValidUuid(contractId)) throw expenseErrors.invalidContract();
  if (freightId && !isValidUuid(freightId)) throw expenseErrors.invalidFreight();
  if (receiptUrl && !isValidReceiptUrl(receiptUrl)) throw expenseErrors.invalidReceiptUrl();

  if (!paymentRequired) {
    financialStatus = 'none';
    dueDate = '';
    paidAt = '';
    linkedPayableId = null;
  }

  if (paymentRequired && financialStatus === 'paid' && !paidAt) {
    paidAt = dueDate || costDate;
  }

  const vehicle = await findTenantVehicleForExpense(vehicleId, tenantId);
  if (!vehicle) throw expenseErrors.vehicleNotFound();

  return {
    date,
    time,
    costDate,
    vehicleId,
    vehicleName: vehicle.name,
    provider,
    category,
    quantity,
    amount,
    odometer,
    status,
    paymentRequired,
    financialStatus,
    dueDate,
    paidAt,
    linkedPayableId,
    contractId: contractId || null,
    freightId: freightId || null,
    receiptUrl: receiptUrl || '',
    observations: observations || '',
  };
}

async function getFreshExpenseOrFallback(tenantId: string, expenseId: string, fallback: ReturnType<typeof mapExpenseRow>) {
  const fresh = await findTenantExpenseById(expenseId, tenantId);
  return fresh ? mapExpenseRow(fresh) : fallback;
}

export async function listExpenses(auth?: AuthContext) {
  if (!auth?.tenantId) return [];
  const rows = await listTenantExpenses(auth.tenantId);
  return rows.map(mapExpenseRow);
}

export async function createExpense(auth: AuthContext | undefined, body: ExpenseInput) {
  const tenantId = auth?.tenantId || '';
  const payload = await validateExpensePayload(body, tenantId);
  const row = await insertTenantExpense(payload, tenantId, auth?.userId);
  if (!row) return null;

  const mapped = mapExpenseRow(row);
  await syncExpensePayable({
    id: row.id,
    ...mapped,
  }, tenantId, auth?.userId);

  return getFreshExpenseOrFallback(tenantId, row.id, mapped);
}

export async function updateExpense(auth: AuthContext | undefined, id: string, body: ExpenseInput) {
  const tenantId = auth?.tenantId || '';
  const payload = await validateExpensePayload(body, tenantId);
  const row = await updateTenantExpense(id, payload, tenantId, auth?.userId);
  if (!row) return undefined;

  const mapped = mapExpenseRow(row);
  await syncExpensePayable({
    id: row.id,
    ...mapped,
  }, tenantId, auth?.userId);

  return getFreshExpenseOrFallback(tenantId, row.id, mapped);
}

export async function deleteExpense(auth: AuthContext | undefined, id: string) {
  const tenantId = auth?.tenantId || '';
  await removeExpensePayable(id, tenantId);
  const deleted = await deleteTenantExpense(id, tenantId);
  return Boolean(deleted);
}
