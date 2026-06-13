import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { validationError } from '../../../shared/errors/app-error';
import { isValidDate, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import {
  deleteTenantRecurringPayable,
  insertGeneratedPayable,
  insertTenantRecurringPayable,
  listActiveRecurringPayablesForGeneration,
  listTenantRecurringPayables,
  updateTenantRecurringPayable,
  type RecurringPayableRow,
} from '../repositories/recurring-payables.repository';

export const recurringPayablePermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'financial'],
  update: ['dev', 'owner', 'admin', 'financial'],
  delete: ['dev', 'owner', 'admin', 'financial'],
};

const statuses = ['active', 'paused'];

export function mapRecurringPayableRow(row: RecurringPayableRow) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    description: row.description,
    providerName: row.provider_name || '',
    amount: Number(row.amount || 0),
    dueDay: Number(row.due_day),
    startsOn: row.starts_on || '',
    endsOn: row.ends_on || '',
    status: row.status,
    notes: row.notes || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateRecurringPayablePayload(body: Record<string, unknown>) {
  const description = normalizeRequiredText(body.description as string);
  const providerName = normalizeOptionalText(body.providerName as string);
  const dueDay = Number(body.dueDay);
  const startsOn = normalizeOptionalText(body.startsOn as string);
  const endsOn = normalizeOptionalText(body.endsOn as string);
  const status = normalizeOptionalText(body.status as string) || 'active';
  const notes = normalizeOptionalText(body.notes as string);

  if (description.length < 3) {
    throw validationError('Informe uma descricao valida para a despesa recorrente.', 'invalid_recurring_payable_description', 'description');
  }

  const numericAmount = Number(body.amount);
  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw validationError('O valor da despesa recorrente deve ser zero ou maior.', 'invalid_recurring_payable_amount', 'amount');
  }
  const amount = Number(numericAmount.toFixed(2));

  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    throw validationError('Informe um dia de vencimento entre 1 e 31.', 'invalid_recurring_payable_due_day', 'dueDay');
  }
  if (startsOn && !isValidDate(startsOn)) {
    throw validationError('Informe uma data de inicio valida.', 'invalid_recurring_payable_starts_on', 'startsOn');
  }
  if (endsOn && !isValidDate(endsOn)) {
    throw validationError('Informe uma data de termino valida.', 'invalid_recurring_payable_ends_on', 'endsOn');
  }
  if (startsOn && endsOn && startsOn > endsOn) {
    throw validationError('O termino da vigencia deve ser posterior ao inicio.', 'invalid_recurring_payable_period', 'endsOn');
  }
  if (!statuses.includes(status)) {
    throw validationError('Informe um status valido para a despesa recorrente.', 'invalid_recurring_payable_status', 'status');
  }

  return {
    description,
    providerName,
    amount,
    dueDay,
    startsOn,
    endsOn,
    status,
    notes,
  };
}

export async function listRecurringPayables(auth?: AuthContext) {
  const rows = await listTenantRecurringPayables(auth?.tenantId);
  return rows.map(mapRecurringPayableRow);
}

export async function createRecurringPayable(auth: AuthContext | undefined, body: Record<string, unknown>) {
  const payload = validateRecurringPayablePayload(body);
  const row = await insertTenantRecurringPayable(payload, auth?.tenantId, auth?.userId);
  return row ? mapRecurringPayableRow(row) : null;
}

export async function updateRecurringPayable(auth: AuthContext | undefined, id: string, body: Record<string, unknown>) {
  const payload = validateRecurringPayablePayload(body);
  const row = await updateTenantRecurringPayable(id, payload, auth?.tenantId, auth?.userId);
  return row ? mapRecurringPayableRow(row) : undefined;
}

export async function deleteRecurringPayable(auth: AuthContext | undefined, id: string) {
  const row = await deleteTenantRecurringPayable(id, auth?.tenantId);
  return Boolean(row);
}

export function getReferenceMonthKey(referenceDate: Date) {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function resolveDueDateForMonth(referenceDate: Date, dueDay: number) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dueDay, lastDayOfMonth);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export async function generateRecurringPayablesForMonth(
  referenceDate = new Date(),
  tenantId?: string,
  actorUserId?: string | null,
) {
  const referenceMonth = getReferenceMonthKey(referenceDate);
  const referenceMonthStart = `${referenceMonth}-01`;
  const templates = await listActiveRecurringPayablesForGeneration(referenceMonthStart, tenantId);
  let created = 0;

  for (const template of templates) {
    if (!template.tenant_id) continue;

    const result = await insertGeneratedPayable({
      tenantId: template.tenant_id,
      recurringPayableId: template.id,
      description: template.description,
      providerName: template.provider_name,
      amount: Number(template.amount || 0),
      dueDate: resolveDueDateForMonth(referenceDate, Number(template.due_day)),
      referenceMonth,
      notes: template.notes,
      actorUserId: actorUserId || null,
    });

    created += result.rowCount || 0;
  }

  return created;
}

export async function generateRecurringPayablesForTenant(auth?: AuthContext, referenceDate = new Date()) {
  if (!auth?.tenantId) return 0;
  return generateRecurringPayablesForMonth(referenceDate, auth.tenantId, auth.userId);
}
