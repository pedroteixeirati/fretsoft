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
  markRevenueAsReceived,
  upsertContractRevenue,
  upsertFreightRevenue,
} from '../repositories/revenues.repository';
import { mapRevenue } from '../dtos/revenue.types';

function formatMonthStartDate(referenceDate: Date) {
  return startOfMonth(referenceDate).toISOString().slice(0, 10);
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
  let contractName = freight.route;
  let description = `Frete avulso ${freight.plate} - ${freight.route}`;

  if (freight.billing_type === 'contract_per_trip' && freight.contract_id) {
    const linkedContract = await findLinkedContract(tenantId, freight.contract_id);
    if (!linkedContract) {
      throw new Error('Contrato vinculado ao frete nao encontrado neste tenant.');
    }

    companyId = linkedContract.company_id;
    companyName = linkedContract.company_name;
    contractId = linkedContract.id;
    contractName = linkedContract.contract_name;
    description = `Frete do contrato ${linkedContract.contract_name} - ${freight.route}`;
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
  return result.rows[0] ? mapRevenue(result.rows[0]) : null;
}

export async function receiveRevenue(revenueId: string, tenantId?: string, actorUserId?: string) {
  const result = await markRevenueAsReceived(actorUserId, revenueId, tenantId);
  return result.rows[0] ? mapRevenue(result.rows[0]) : null;
}

export async function overdueRevenue(revenueId: string, tenantId?: string, actorUserId?: string) {
  const result = await markRevenueAsOverdue(actorUserId, revenueId, tenantId);
  return result.rows[0] ? mapRevenue(result.rows[0]) : null;
}
