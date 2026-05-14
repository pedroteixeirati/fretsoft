import type { PoolClient } from 'pg';
import type { ResourcePermissions } from '../../../shared/authorization/permissions';
import { conflictError, forbiddenError, notFoundError, validationError } from '../../../shared/errors/app-error';
import { isPositiveNumber, isValidDate, isValidUuid, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import type { AuthContext } from '../../auth/dtos/auth-context';
import { updateNovalogBillingRevenueFromItem, updateNovalogBillingRevenueStatus } from '../../revenues/repositories/revenues.repository';
import { formatCompetenceLabel, parseDateInput } from '../../revenues/services/revenues-domain';
import type { NovalogBillingInput, NovalogBillingItemInput, NovalogBillingItemPayload, NovalogBillingItemStatus, NovalogBillingPayload, NovalogBillingStatus } from '../dtos/novalog-billing.types';
import {
  findCompanyForNovalogBilling,
  findTenantNovalogBilling,
  findTenantNovalogBillingItem,
  getPoolClient,
  insertTenantNovalogBilling,
  linkRevenueToNovalogBillingItem,
  listTenantNovalogBillingItems,
  listTenantNovalogBillings,
  listTenantNovalogReportPayments,
  replaceTenantNovalogBillingItems,
  countActiveTenantNovalogBillingItems,
  updateTenantNovalogBillingItem,
  updateTenantNovalogBillingDraft,
  updateTenantNovalogBillingItemStatus,
  updateTenantNovalogBillingStatus,
  updateNovalogBillingItemStatusByRevenue,
  type NovalogBillingItemRow,
  type NovalogBillingRow,
} from '../repositories/novalog-billings.repository';

export const novalogBillingPermissions: ResourcePermissions = {
  read: ['dev', 'owner', 'admin', 'financial', 'operational', 'viewer'],
  create: ['dev', 'owner', 'admin', 'financial'],
  update: ['dev', 'owner', 'admin', 'financial'],
  delete: [],
};

function ensureNovalogContext(auth?: AuthContext) {
  if (!auth?.tenantId) {
    throw forbiddenError('Acesso ao modulo de faturamentos Novalog requer um tenant autenticado.');
  }

  if (auth.role !== 'dev' && auth.tenantSlug !== 'novalog') {
    throw forbiddenError('Faturamentos Novalog estao disponiveis apenas para a operacao Novalog.');
  }
}

function mapBilling(row: NovalogBillingRow, items?: NovalogBillingItemRow[]) {
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    companyId: row.company_id,
    companyName: row.company_name,
    billingDate: row.billing_date,
    dueDate: row.due_date,
    status: row.status,
    notes: row.notes || '',
    cteCount: Number(row.cte_count || 0),
    totalAmount: Number(row.total_amount || 0),
    receivedAmount: Number(row.received_amount || 0),
    openAmount: Number(row.open_amount || 0),
    overdueAmount: Number(row.overdue_amount || 0),
    createdAt: row.created_at,
    items: items?.map(mapBillingItem),
  };
}

function mapBillingItem(row: NovalogBillingItemRow) {
  const amount = Number(row.amount || 0);
  const receivedAmount = Number(row.received_amount ?? (row.status === 'received' ? row.amount : 0) ?? 0);
  return {
    id: row.id,
    displayId: row.display_id !== null && row.display_id !== undefined ? Number(row.display_id) : undefined,
    billingId: row.billing_id,
    cteNumber: row.cte_number,
    cteKey: row.cte_key || '',
    issueDate: row.issue_date || '',
    dueDate: row.due_date || '',
    originName: row.origin_name || '',
    destinationName: row.destination_name || '',
    amount,
    receivedAmount,
    balanceAmount: Number(row.balance_amount ?? Math.max(amount - receivedAmount, 0)),
    paymentCount: Number(row.payment_count || 0),
    status: row.status,
    receivedAt: row.received_at || undefined,
    lastPaymentAt: row.last_payment_at || undefined,
    notes: row.notes || '',
    linkedRevenueId: row.linked_revenue_id || undefined,
    createdAt: row.created_at,
  };
}

function deriveBillingStatus(items: NovalogBillingItemRow[], currentStatus: NovalogBillingStatus): NovalogBillingStatus {
  if (currentStatus === 'draft' || currentStatus === 'canceled') return currentStatus;
  const activeItems = items.filter((item) => item.status !== 'canceled');
  if (activeItems.length === 0) return 'open';
  if (activeItems.every((item) => item.status === 'received')) return 'received';
  if (activeItems.some((item) => item.status === 'overdue')) return 'overdue';
  if (activeItems.some((item) => item.status === 'received' || item.status === 'partially_received')) return 'partially_received';
  return 'open';
}

function normalizeBillingItem(item: NovalogBillingItemInput, index: number, fallbackDueDate?: string): NovalogBillingItemPayload {
  const cteNumber = normalizeRequiredText(item.cteNumber);
  const cteKey = normalizeOptionalText(item.cteKey);
  const issueDate = normalizeOptionalText(item.issueDate);
  const dueDate = normalizeOptionalText(item.dueDate) || fallbackDueDate;
  const originName = normalizeOptionalText(item.originName);
  const destinationName = normalizeOptionalText(item.destinationName);
  const notes = normalizeOptionalText(item.notes);
  const amount = Number(item.amount);

  if (cteNumber.length < 1) {
    throw validationError('Informe o numero do CT-e.', 'invalid_novalog_billing_cte_number', `items.${index}.cteNumber`);
  }
  if (issueDate && !isValidDate(issueDate)) {
    throw validationError('Informe uma data de emissao valida.', 'invalid_novalog_billing_cte_issue_date', `items.${index}.issueDate`);
  }
  if (!isValidDate(dueDate)) {
    throw validationError('Informe uma data de vencimento valida para o CT-e.', 'invalid_novalog_billing_cte_due_date', `items.${index}.dueDate`);
  }
  if (!isPositiveNumber(amount)) {
    throw validationError('Informe um valor maior que zero para o CT-e.', 'invalid_novalog_billing_cte_amount', `items.${index}.amount`);
  }

  return {
    cteNumber,
    cteKey,
    issueDate,
    dueDate,
    originName,
    destinationName,
    amount,
    notes,
  };
}

async function validateBillingPayload(auth: AuthContext | undefined, body: NovalogBillingInput): Promise<NovalogBillingPayload> {
  ensureNovalogContext(auth);
  const companyId = normalizeRequiredText(body.companyId);
  const billingDate = normalizeRequiredText(body.billingDate);
  const fallbackDueDate = normalizeOptionalText(body.dueDate);
  const notes = normalizeOptionalText(body.notes);
  const items = Array.isArray(body.items) ? body.items : [];

  if (!isValidUuid(companyId)) {
    throw validationError('Selecione um cliente valido para o faturamento.', 'invalid_novalog_billing_company', 'companyId');
  }
  if (!isValidDate(billingDate)) {
    throw validationError('Informe uma data valida para o faturamento.', 'invalid_novalog_billing_date', 'billingDate');
  }
  if (fallbackDueDate && !isValidDate(fallbackDueDate)) {
    throw validationError('Informe uma data de vencimento valida.', 'invalid_novalog_billing_due_date', 'dueDate');
  }
  if (items.length === 0) {
    throw validationError('Adicione ao menos um CT-e ao faturamento.', 'invalid_novalog_billing_items', 'items');
  }

  const company = await findCompanyForNovalogBilling(companyId, auth?.tenantId || '');
  if (!company) {
    throw notFoundError('Cliente nao encontrado neste tenant.', 'novalog_billing_company_not_found');
  }

  const normalizedItems = items.map((item, index) => normalizeBillingItem(item, index, fallbackDueDate));
  const dueDate = fallbackDueDate || [...normalizedItems].sort((left, right) => left.dueDate.localeCompare(right.dueDate))[0]?.dueDate;
  if (!dueDate) {
    throw validationError('Informe uma data de vencimento valida.', 'invalid_novalog_billing_due_date', 'dueDate');
  }
  const uniqueCtes = new Set<string>();
  for (const item of normalizedItems) {
    const key = item.cteNumber.toLocaleLowerCase('pt-BR');
    if (uniqueCtes.has(key)) {
      throw conflictError('O mesmo CT-e foi informado mais de uma vez neste faturamento.', 'duplicated_novalog_billing_cte', 'items');
    }
    uniqueCtes.add(key);
  }

  return {
    companyId: company.id,
    companyName: company.company_name,
    billingDate,
    dueDate,
    notes,
    items: normalizedItems,
  };
}

async function getBillingDetail(billingId: string, tenantId: string, client?: PoolClient) {
  const billing = await findTenantNovalogBilling(billingId, tenantId, client);
  if (!billing) return null;
  const items = await listTenantNovalogBillingItems(billingId, tenantId, client);
  return mapBilling(billing, items);
}

async function refreshBillingStatus(billingId: string, tenantId: string, userId?: string, client?: PoolClient) {
  const billing = await findTenantNovalogBilling(billingId, tenantId, client);
  if (!billing) return null;
  const items = await listTenantNovalogBillingItems(billingId, tenantId, client);
  const nextStatus = deriveBillingStatus(items, billing.status);
  if (nextStatus !== billing.status) {
    await updateTenantNovalogBillingStatus(billingId, tenantId, nextStatus, userId, client);
  }
  return nextStatus;
}

function buildCompetence(dueDate: string) {
  const parsed = parseDateInput(dueDate) || new Date();
  return {
    month: parsed.getMonth() + 1,
    year: parsed.getFullYear(),
    label: formatCompetenceLabel(parsed),
  };
}

async function createRevenueForBillingItem(billing: NovalogBillingRow, item: NovalogBillingItemRow, userId: string | undefined, client: PoolClient) {
  if (item.linked_revenue_id || item.status === 'canceled') return;

  const itemDueDate = item.due_date || billing.due_date;
  const competence = buildCompetence(itemDueDate);
  const revenueResult = await client.query<{ id: string }>(
    `insert into revenues (
       tenant_id,
       company_id,
       company_name,
       novalog_billing_id,
       novalog_billing_item_id,
       competence_month,
       competence_year,
       competence_label,
       description,
       amount,
       due_date,
       status,
       source_type,
       created_by_user_id,
       updated_by_user_id
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'novalog_billing_item', $12, $12)
     on conflict (novalog_billing_item_id) where novalog_billing_item_id is not null do update set
       company_id = excluded.company_id,
       company_name = excluded.company_name,
       competence_month = excluded.competence_month,
       competence_year = excluded.competence_year,
       competence_label = excluded.competence_label,
       description = excluded.description,
       amount = excluded.amount,
       due_date = excluded.due_date,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_at = now()
     returning id`,
    [
      billing.tenant_id,
      billing.company_id,
      billing.company_name,
      billing.id,
      item.id,
      competence.month,
      competence.year,
      competence.label,
      `CT-e ${item.cte_number} - Faturamento Novalog ${billing.display_id ? `#${billing.display_id}` : billing.company_name}`,
      Number(item.amount || 0),
      itemDueDate,
      userId || null,
    ],
  );

  const revenueId = revenueResult.rows[0]?.id;
  if (revenueId) {
    await linkRevenueToNovalogBillingItem(item.id, billing.tenant_id, revenueId, userId, client);
  }
}

async function syncRevenueFromBillingItem(billing: NovalogBillingRow, item: NovalogBillingItemRow, userId: string | undefined, client: PoolClient) {
  if (!item.linked_revenue_id) return;

  const itemDueDate = item.due_date || billing.due_date;
  const competence = buildCompetence(itemDueDate);
  const result = await updateNovalogBillingRevenueFromItem({
    revenueId: item.linked_revenue_id,
    tenantId: billing.tenant_id,
    companyId: billing.company_id,
    companyName: billing.company_name,
    billingId: billing.id,
    billingItemId: item.id,
    competenceMonth: competence.month,
    competenceYear: competence.year,
    competenceLabel: competence.label,
    description: `CT-e ${item.cte_number} - Faturamento Novalog ${billing.display_id ? `#${billing.display_id}` : billing.company_name}`,
    amount: Number(item.amount || 0),
    dueDate: itemDueDate,
    actorUserId: userId || null,
  }, client);

  if (result.rowCount === 0) {
    throw validationError('Recebivel vinculado ja foi recebido e nao pode ser alterado.', 'novalog_billing_revenue_not_editable');
  }
}

export async function listNovalogBillings(auth?: AuthContext) {
  ensureNovalogContext(auth);
  const rows = await listTenantNovalogBillings(auth?.tenantId || '');
  return rows.map((row) => mapBilling(row));
}

export async function listNovalogReportPayments(auth?: AuthContext) {
  ensureNovalogContext(auth);
  const rows = await listTenantNovalogReportPayments(auth?.tenantId || '');

  return rows.map((row) => ({
    id: row.id,
    revenueId: row.revenue_id,
    billingId: row.novalog_billing_id || undefined,
    billingItemId: row.novalog_billing_item_id || undefined,
    companyId: row.company_id || '',
    companyName: row.company_name || 'Cliente nao informado',
    cteNumber: row.cte_number || '-',
    amount: Number(row.amount || 0),
    paymentDate: row.payment_date,
    notes: row.notes || '',
  }));
}

export async function getNovalogBilling(auth: AuthContext | undefined, id: string) {
  ensureNovalogContext(auth);
  return getBillingDetail(id, auth?.tenantId || '');
}

export async function createNovalogBilling(auth: AuthContext | undefined, body: NovalogBillingInput) {
  const payload = await validateBillingPayload(auth, body);
  try {
    const billing = await insertTenantNovalogBilling(payload, auth?.tenantId || '', auth?.userId);
    return billing ? mapBilling(billing) : null;
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      throw conflictError('Um ou mais CT-es ja existem em outro faturamento Novalog.', 'duplicated_novalog_billing_cte', 'items');
    }
    throw error;
  }
}

export async function updateNovalogBilling(auth: AuthContext | undefined, id: string, body: NovalogBillingInput) {
  const payload = await validateBillingPayload(auth, body);
  const tenantId = auth?.tenantId || '';
  const current = await findTenantNovalogBilling(id, tenantId);
  if (!current) return null;
  if (current.status !== 'draft') {
    throw validationError('Apenas faturamentos em rascunho podem ser editados.', 'novalog_billing_not_editable');
  }

  try {
    await updateTenantNovalogBillingDraft(id, tenantId, payload, auth?.userId);
    await replaceTenantNovalogBillingItems(id, tenantId, payload.items, auth?.userId);
    return getBillingDetail(id, tenantId);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') {
      throw conflictError('Um ou mais CT-es ja existem em outro faturamento Novalog.', 'duplicated_novalog_billing_cte', 'items');
    }
    throw error;
  }
}

export async function closeNovalogBilling(auth: AuthContext | undefined, id: string) {
  ensureNovalogContext(auth);
  const tenantId = auth?.tenantId || '';
  const client = await getPoolClient();

  try {
    await client.query('begin');
    const billing = await findTenantNovalogBilling(id, tenantId, client);
    if (!billing) return null;
    if (billing.status === 'canceled') {
      throw validationError('Faturamento cancelado nao pode ser fechado.', 'novalog_billing_canceled');
    }

    const items = await listTenantNovalogBillingItems(id, tenantId, client);
    if (items.length === 0) {
      throw validationError('Adicione ao menos um CT-e antes de fechar o faturamento.', 'invalid_novalog_billing_items', 'items');
    }

    for (const item of items) {
      await createRevenueForBillingItem(billing, item, auth?.userId, client);
    }

    await updateTenantNovalogBillingStatus(id, tenantId, deriveBillingStatus(items, 'open'), auth?.userId, client);
    await client.query('commit');
    return getBillingDetail(id, tenantId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateNovalogBillingItem(auth: AuthContext | undefined, itemId: string, body: NovalogBillingItemInput) {
  ensureNovalogContext(auth);
  const tenantId = auth?.tenantId || '';
  const currentItem = await findTenantNovalogBillingItem(itemId, tenantId);
  if (!currentItem) return null;
  const billingForFallback = await findTenantNovalogBilling(currentItem.billing_id, tenantId);
  if (!billingForFallback) return null;
  const payload = normalizeBillingItem(body, 0, billingForFallback.due_date);
  const client = await getPoolClient();

  try {
    await client.query('begin');
    const item = await findTenantNovalogBillingItem(itemId, tenantId, client);
    if (!item) {
      await client.query('rollback');
      return null;
    }
    if (item.status === 'received' || item.status === 'partially_received') {
      throw validationError('CT-e com recebimento registrado nao pode ser editado.', 'novalog_billing_item_received_not_editable');
    }
    if (item.status === 'canceled') {
      throw validationError('CT-e cancelado nao pode ser editado.', 'novalog_billing_item_canceled_not_editable');
    }

    const billing = await findTenantNovalogBilling(item.billing_id, tenantId, client);
    if (!billing) {
      await client.query('rollback');
      return null;
    }

    const result = await updateTenantNovalogBillingItem(itemId, tenantId, payload, auth?.userId, client);
    const updatedItem = result.rows[0];
    if (!updatedItem) {
      throw validationError('CT-e nao pode ser editado no status atual.', 'novalog_billing_item_not_editable');
    }

    await syncRevenueFromBillingItem(billing, updatedItem, auth?.userId, client);
    await refreshBillingStatus(updatedItem.billing_id, tenantId, auth?.userId, client);
    await client.query('commit');
    return getBillingDetail(updatedItem.billing_id, tenantId);
  } catch (error) {
    await client.query('rollback');
    if ((error as { code?: string }).code === '23505') {
      throw conflictError('Este CT-e ja existe em outro faturamento Novalog.', 'duplicated_novalog_billing_cte', 'cteNumber');
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteNovalogBillingItem(auth: AuthContext | undefined, itemId: string) {
  ensureNovalogContext(auth);
  const tenantId = auth?.tenantId || '';
  const client = await getPoolClient();

  try {
    await client.query('begin');
    const item = await findTenantNovalogBillingItem(itemId, tenantId, client);
    if (!item) {
      await client.query('rollback');
      return null;
    }
    if (item.status === 'received' || item.status === 'partially_received') {
      throw validationError('CT-e com recebimento registrado nao pode ser excluido.', 'novalog_billing_item_received_not_deletable');
    }
    if (item.status === 'canceled') {
      throw validationError('CT-e ja esta cancelado.', 'novalog_billing_item_already_canceled');
    }

    const activeItems = await countActiveTenantNovalogBillingItems(item.billing_id, tenantId, client);
    if (activeItems <= 1) {
      throw validationError('Faturamento deve manter ao menos um CT-e.', 'novalog_billing_requires_item');
    }

    const result = await updateTenantNovalogBillingItemStatus(itemId, tenantId, 'canceled', auth?.userId, client);
    const updatedItem = result.rows[0];
    if (!updatedItem) {
      throw validationError('CT-e nao pode ser excluido no status atual.', 'novalog_billing_item_not_deletable');
    }

    if (updatedItem.linked_revenue_id) {
      const revenueResult = await updateNovalogBillingRevenueStatus(updatedItem.linked_revenue_id, tenantId, 'canceled', auth?.userId, client);
      if (revenueResult.rowCount === 0) {
        throw validationError('Recebivel vinculado nao pode ser cancelado.', 'novalog_billing_revenue_not_cancelable');
      }
    }

    await refreshBillingStatus(updatedItem.billing_id, tenantId, auth?.userId, client);
    await client.query('commit');
    return getBillingDetail(updatedItem.billing_id, tenantId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function changeNovalogBillingItemStatus(auth: AuthContext | undefined, itemId: string, status: NovalogBillingItemStatus) {
  ensureNovalogContext(auth);
  const tenantId = auth?.tenantId || '';
  const item = await findTenantNovalogBillingItem(itemId, tenantId);
  if (!item) return null;
  const billing = await findTenantNovalogBilling(item.billing_id, tenantId);
  if (!billing) return null;
  if (billing.status === 'draft') {
    throw validationError('Feche o faturamento antes de baixar CT-es.', 'novalog_billing_not_closed');
  }

  const result = await updateTenantNovalogBillingItemStatus(itemId, tenantId, status, auth?.userId);
  const updatedItem = result.rows[0];
  if (!updatedItem) return null;

  if (updatedItem.linked_revenue_id) {
    const revenueStatus = status === 'canceled' ? 'canceled' : status;
    await updateNovalogBillingRevenueStatus(updatedItem.linked_revenue_id, tenantId, revenueStatus, auth?.userId);
  }

  await refreshBillingStatus(updatedItem.billing_id, tenantId, auth?.userId);
  return getBillingDetail(updatedItem.billing_id, tenantId);
}

export async function syncNovalogBillingItemFromRevenue(tenantId: string | undefined, revenueId: string, status: NovalogBillingItemStatus, actorUserId?: string) {
  if (!tenantId) return;
  const result = await updateNovalogBillingItemStatusByRevenue(revenueId, tenantId, status, actorUserId);
  const item = result.rows[0];
  if (item) {
    await refreshBillingStatus(item.billing_id, tenantId, actorUserId);
  }
}
