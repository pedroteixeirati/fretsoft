import { notFoundError, validationError } from '../../../shared/errors/app-error';
import { isPositiveNumber, isValidDate, normalizeOptionalText, normalizeRequiredText } from '../../../shared/validation/validation';
import {
  addMonths,
  formatCompetenceLabel,
  formatDueDate,
  monthDiff,
  parseDateInput,
  shouldGenerateContractRevenue,
  startOfMonth,
} from './revenues-domain';
import {
  deleteFreightRevenue,
  findLinkedContract,
  insertScheduledContractRevenue,
  listActiveRecurringContractsForScheduledGeneration,
  listContractsForRevenueGeneration,
  listFreightsForRevenueSync,
  listRevenuesByTenant,
  markRevenueAsCharged,
  markRevenueAsOverdue,
  upsertContractRevenue,
  upsertFreightRevenue,
} from '../repositories/revenues.repository';
import {
  findRevenueByIdForUpdate,
  findRevenuePaymentByIdForUpdate,
  getRevenuePoolClient,
  insertRevenuePayment,
  listRevenuePaymentsByRevenue,
  reverseRevenuePayment,
  sumRevenuePayments,
  updateRevenuePaymentState,
} from '../repositories/revenue-payments.repository';
import { mapRevenue, mapRevenuePayment, type RevenueStatus } from '../dtos/revenue.types';
import { syncNovalogBillingItemFromRevenue } from '../../novalog/services/novalog-billings.service';

function formatMonthStartDate(referenceDate: Date) {
  return startOfMonth(referenceDate).toISOString().slice(0, 10);
}

function formatTodayDate() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

function formatFreightSegment(freight: { origin: string; destination: string }) {
  return `${freight.origin} x ${freight.destination}`;
}

function deriveRevenueStatusAfterPayments(revenue: { amount: string | number; charge_reference?: string | null }, receivedAmount: number): RevenueStatus {
  const totalAmount = Number(revenue.amount || 0);
  if (receivedAmount >= totalAmount - 0.009) return 'received';
  if (receivedAmount > 0.009) return 'partially_received';
  return revenue.charge_reference ? 'billed' : 'pending';
}

function isContractActiveForCompetence(contract: { start_date: string; end_date: string }, competenceDate: Date) {
  const startDate = parseDateInput(contract.start_date);
  if (!startDate) return false;

  const competenceMonth = startOfMonth(competenceDate);
  const startMonth = startOfMonth(startDate);
  if (competenceMonth < startMonth) {
    return false;
  }

  const endDate = parseDateInput(contract.end_date);
  if (!endDate) {
    return true;
  }

  return competenceMonth <= startOfMonth(endDate);
}

export async function createScheduledRecurringRevenues(referenceDate = new Date()) {
  const contractsResult = await listActiveRecurringContractsForScheduledGeneration();
  let created = 0;
  const competenceDate = startOfMonth(referenceDate);
  const dueDate = formatMonthStartDate(referenceDate);

  for (const contract of contractsResult.rows) {
    if (!contract.tenant_id) continue;
    if (!shouldGenerateContractRevenue(contract.remuneration_type, Number(contract.monthly_value || 0))) {
      continue;
    }
    if (!isContractActiveForCompetence(contract, competenceDate)) {
      continue;
    }

    const result = await insertScheduledContractRevenue({
      tenantId: contract.tenant_id,
      companyId: contract.company_id,
      companyName: contract.company_name,
      contractId: contract.id,
      contractName: contract.contract_name,
      competenceMonth: competenceDate.getMonth() + 1,
      competenceYear: competenceDate.getFullYear(),
      competenceLabel: formatCompetenceLabel(competenceDate),
      description: `Repasse mensal do contrato ${contract.contract_name}`,
      amount: Number(contract.monthly_value || 0),
      dueDate,
      actorUserId: null,
    });

    created += result.rowCount || 0;
  }

  return created;
}

export async function generateMonthlyRevenuesForTenant(tenantId?: string, actorUserId?: string) {
  if (!tenantId) return 0;

  const contractsResult = await listContractsForRevenueGeneration(tenantId);
  let generated = 0;
  const currentMonth = startOfMonth(new Date());

  for (const contract of contractsResult.rows) {
    if (!shouldGenerateContractRevenue(contract.remuneration_type, Number(contract.monthly_value || 0))) {
      continue;
    }

    const startDate = parseDateInput(contract.start_date);
    const endDate = parseDateInput(contract.end_date);
    if (!startDate) continue;

    const startMonth = startOfMonth(startDate);
    const lastMonth = endDate ? startOfMonth(endDate) : currentMonth;
    const generationLimit = lastMonth < currentMonth ? lastMonth : currentMonth;
    const totalMonths = monthDiff(startMonth, generationLimit);
    if (totalMonths < 0) continue;

    for (let offset = 0; offset <= totalMonths; offset += 1) {
      const competenceDate = addMonths(startMonth, offset);
      const result = await upsertContractRevenue({
        tenantId,
        companyId: contract.company_id,
        companyName: contract.company_name,
        contractId: contract.id,
        contractName: contract.contract_name,
        competenceMonth: competenceDate.getMonth() + 1,
        competenceYear: competenceDate.getFullYear(),
        competenceLabel: formatCompetenceLabel(competenceDate),
        description: `Repasse mensal do contrato ${contract.contract_name}`,
        amount: Number(contract.monthly_value || 0),
        dueDate: formatDueDate(competenceDate, startDate),
        actorUserId,
      });

      generated += result.rowCount || 0;
    }
  }

  return generated;
}

export async function syncFreightRevenue(tenantId: string | undefined, freight: Awaited<ReturnType<typeof listFreightsForRevenueSync>>['rows'][number], actorUserId?: string) {
  if (!tenantId) return;

  if (freight.billing_type === 'contract_recurring') {
    await deleteFreightRevenue(tenantId, freight.id);
    return;
  }

  const freightDate = parseDateInput(freight.date);
  if (!freightDate) return;

  let companyId: string | null = null;
  let companyName = 'Fretes avulsos';
  let contractId: string | null = null;
  const freightSegment = formatFreightSegment(freight);
  let contractName = freightSegment;
  let description = `Frete avulso ${freight.plate} - ${freightSegment}`;

  if (freight.billing_type === 'contract_per_trip' && freight.contract_id) {
    const linkedContract = await findLinkedContract(tenantId, freight.contract_id);
    if (!linkedContract) {
      throw notFoundError('Contrato vinculado ao frete nao encontrado neste tenant.', 'freight_contract_not_found');
    }

    companyId = linkedContract.company_id;
    companyName = linkedContract.company_name;
    contractId = linkedContract.id;
    contractName = linkedContract.contract_name;
    description = `Frete do contrato ${linkedContract.contract_name} - ${freightSegment}`;
  }

  await upsertFreightRevenue({
    tenantId,
    companyId,
    companyName,
    contractId,
    contractName,
    freightId: freight.id,
    competenceMonth: freightDate.getMonth() + 1,
    competenceYear: freightDate.getFullYear(),
    competenceLabel: formatCompetenceLabel(freightDate),
    description,
    amount: Number(freight.amount || 0),
    dueDate: freight.date,
    actorUserId,
  });
}

export async function syncFreightRevenuesForTenant(tenantId?: string, actorUserId?: string) {
  if (!tenantId) return 0;

  const freightsResult = await listFreightsForRevenueSync(tenantId);

  for (const freight of freightsResult.rows) {
    await syncFreightRevenue(tenantId, freight, actorUserId);
  }

  return freightsResult.rows.length;
}

export async function listTenantRevenues(tenantId?: string, actorUserId?: string) {
  if (!tenantId) return [];

  await syncFreightRevenuesForTenant(tenantId, actorUserId);

  const result = await listRevenuesByTenant(tenantId);
  return result.rows.map(mapRevenue);
}

export async function generateTenantRevenues(tenantId?: string, actorUserId?: string) {
  const syncedFreights = await syncFreightRevenuesForTenant(tenantId, actorUserId);
  return { generated: syncedFreights };
}

export async function chargeRevenue(revenueId: string, tenantId?: string, actorUserId?: string) {
  const chargeReference = `COB-${new Date().getFullYear()}-${revenueId.slice(0, 8).toUpperCase()}`;
  const result = await markRevenueAsCharged(chargeReference, actorUserId, revenueId, tenantId);
  if (result.rows[0]?.source_type === 'novalog_billing_item') {
    await syncNovalogBillingItemFromRevenue(tenantId, revenueId, 'billed', actorUserId);
  }
  return result.rows[0] ? mapRevenue(result.rows[0]) : null;
}

export async function receiveRevenue(revenueId: string, tenantId?: string, actorUserId?: string) {
  return registerRevenuePayment(revenueId, tenantId, {
    paymentDate: formatTodayDate(),
    notes: 'Baixa total registrada pelo contas a receber.',
  }, actorUserId);
}

export async function overdueRevenue(revenueId: string, tenantId?: string, actorUserId?: string) {
  const result = await markRevenueAsOverdue(actorUserId, revenueId, tenantId);
  if (result.rows[0]?.source_type === 'novalog_billing_item') {
    await syncNovalogBillingItemFromRevenue(tenantId, revenueId, 'overdue', actorUserId);
  }
  return result.rows[0] ? mapRevenue(result.rows[0]) : null;
}

export async function listRevenuePayments(revenueId: string, tenantId?: string) {
  if (!tenantId) return [];
  const result = await listRevenuePaymentsByRevenue(revenueId, tenantId);
  return result.rows.map(mapRevenuePayment);
}

export async function registerRevenuePayment(
  revenueId: string,
  tenantId: string | undefined,
  body: { amount?: number | string | null; paymentDate?: string | null; notes?: string | null },
  actorUserId?: string,
) {
  if (!tenantId) return null;

  const paymentDate = normalizeOptionalText(body.paymentDate) || formatTodayDate();
  if (!isValidDate(paymentDate)) {
    throw validationError('Informe uma data de recebimento valida.', 'invalid_revenue_payment_date', 'paymentDate');
  }

  const client = await getRevenuePoolClient();

  try {
    await client.query('begin');
    const revenueResult = await findRevenueByIdForUpdate(revenueId, tenantId, client);
    const revenue = revenueResult.rows[0];
    if (!revenue) {
      await client.query('rollback');
      return null;
    }
    if (revenue.status === 'canceled') {
      throw validationError('Conta cancelada nao pode receber pagamento.', 'revenue_payment_canceled');
    }

    const receivedBefore = await sumRevenuePayments(revenueId, tenantId, client);
    const totalAmount = Number(revenue.amount || 0);
    const balance = Math.max(totalAmount - receivedBefore, 0);
    const paymentAmount = body.amount === undefined || body.amount === null || body.amount === ''
      ? balance
      : Number(body.amount);

    if (!isPositiveNumber(paymentAmount)) {
      throw validationError('Informe um valor de recebimento maior que zero.', 'invalid_revenue_payment_amount', 'amount');
    }
    if (paymentAmount - balance > 0.009) {
      throw validationError('Valor recebido nao pode ultrapassar o saldo em aberto.', 'revenue_payment_exceeds_balance', 'amount');
    }

    await insertRevenuePayment({
      tenantId,
      revenueId,
      amount: paymentAmount,
      paymentDate,
      notes: normalizeOptionalText(body.notes),
      actorUserId,
    }, client);

    const receivedAfter = receivedBefore + paymentAmount;
    const nextStatus = deriveRevenueStatusAfterPayments(revenue, receivedAfter);
    const updatedResult = await updateRevenuePaymentState({
      revenueId,
      tenantId,
      status: nextStatus,
      actorUserId,
    }, client);
    const updatedRevenue = updatedResult.rows[0];

    await client.query('commit');

    if (updatedRevenue?.source_type === 'novalog_billing_item') {
      await syncNovalogBillingItemFromRevenue(tenantId, revenueId, nextStatus, actorUserId);
    }

    if (!updatedRevenue) return null;
    updatedRevenue.received_amount = receivedAfter;
    updatedRevenue.balance_amount = Math.max(totalAmount - receivedAfter, 0);
    updatedRevenue.payment_count = (await listRevenuePaymentsByRevenue(revenueId, tenantId)).rowCount || 0;
    updatedRevenue.last_payment_at = paymentDate;
    return mapRevenue(updatedRevenue);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function reverseRegisteredRevenuePayment(
  revenueId: string,
  paymentId: string,
  tenantId: string | undefined,
  body: { reason?: string | null },
  actorUserId?: string,
) {
  if (!tenantId) return null;
  const reason = normalizeRequiredText(body.reason);
  if (reason.length < 3) {
    throw validationError('Informe o motivo do estorno.', 'invalid_revenue_payment_reversal_reason', 'reason');
  }

  const client = await getRevenuePoolClient();

  try {
    await client.query('begin');
    const revenueResult = await findRevenueByIdForUpdate(revenueId, tenantId, client);
    const revenue = revenueResult.rows[0];
    if (!revenue) {
      await client.query('rollback');
      return null;
    }
    if (revenue.status === 'canceled') {
      throw validationError('Conta cancelada nao pode ter pagamentos estornados.', 'revenue_payment_reversal_canceled');
    }

    const paymentResult = await findRevenuePaymentByIdForUpdate(paymentId, revenueId, tenantId, client);
    const payment = paymentResult.rows[0];
    if (!payment) {
      await client.query('rollback');
      return null;
    }
    if (payment.status === 'reversed') {
      throw validationError('Este pagamento ja foi estornado.', 'revenue_payment_already_reversed');
    }

    const reverseResult = await reverseRevenuePayment({
      paymentId,
      revenueId,
      tenantId,
      reason,
      actorUserId,
    }, client);
    if (reverseResult.rowCount === 0) {
      throw validationError('Este pagamento nao pode ser estornado.', 'revenue_payment_not_reversible');
    }

    const receivedAfter = await sumRevenuePayments(revenueId, tenantId, client);
    const totalAmount = Number(revenue.amount || 0);
    const nextStatus = deriveRevenueStatusAfterPayments(revenue, receivedAfter);
    const updatedResult = await updateRevenuePaymentState({
      revenueId,
      tenantId,
      status: nextStatus,
      actorUserId,
    }, client);
    const updatedRevenue = updatedResult.rows[0];

    await client.query('commit');

    if (updatedRevenue?.source_type === 'novalog_billing_item') {
      await syncNovalogBillingItemFromRevenue(tenantId, revenueId, nextStatus, actorUserId);
    }

    if (!updatedRevenue) return null;
    updatedRevenue.received_amount = receivedAfter;
    updatedRevenue.balance_amount = Math.max(totalAmount - receivedAfter, 0);
    const paymentsResult = await listRevenuePaymentsByRevenue(revenueId, tenantId);
    updatedRevenue.payment_count = paymentsResult.rowCount || 0;
    updatedRevenue.last_payment_at = paymentsResult.rows.find((current) => current.status === 'active')?.payment_date || null;
    return mapRevenue(updatedRevenue);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
