import { pool } from '../../../shared/infra/database/pool';
import type {
  ContractRevenueSeedRow,
  FreightLinkedContractRow,
  FreightRevenueSeedRow,
  RevenueRow,
} from '../dtos/revenue.types';

export function listContractsForRevenueGeneration(tenantId: string) {
  return pool.query<ContractRevenueSeedRow>(
    `select id,
            company_id,
            company_name,
            contract_name,
            remuneration_type,
            monthly_value,
            start_date,
            end_date,
            status
     from contracts
     where tenant_id = $1
       and status in ('active', 'renewal')`,
    [tenantId]
  );
}

export function listActiveRecurringContractsForScheduledGeneration() {
  return pool.query<ContractRevenueSeedRow>(
    `select tenant_id,
            id,
            company_id,
            company_name,
            contract_name,
            remuneration_type,
            monthly_value,
            start_date,
            end_date,
            status
     from contracts
     where remuneration_type = 'recurring'
       and status = 'active'`
  );
}

export function upsertContractRevenue(params: {
  tenantId: string;
  companyId: string;
  companyName: string;
  contractId: string;
  contractName: string;
  competenceMonth: number;
  competenceYear: number;
  competenceLabel: string;
  description: string;
  amount: number;
  dueDate: string;
  actorUserId?: string | null;
}) {
  return pool.query(
    `insert into revenues (
       tenant_id,
       company_id,
       company_name,
       contract_id,
       contract_name,
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
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending', 'contract', $12, $12)
     on conflict (tenant_id, contract_id, competence_month, competence_year) do update set
       company_id = excluded.company_id,
       company_name = excluded.company_name,
       contract_name = excluded.contract_name,
       competence_label = excluded.competence_label,
       description = excluded.description,
       amount = excluded.amount,
       due_date = excluded.due_date,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_at = now()`,
    [
      params.tenantId,
      params.companyId,
      params.companyName,
      params.contractId,
      params.contractName,
      params.competenceMonth,
      params.competenceYear,
      params.competenceLabel,
      params.description,
      params.amount,
      params.dueDate,
      params.actorUserId || null,
    ]
  );
}

export function insertScheduledContractRevenue(params: {
  tenantId: string;
  companyId: string;
  companyName: string;
  contractId: string;
  contractName: string;
  competenceMonth: number;
  competenceYear: number;
  competenceLabel: string;
  description: string;
  amount: number;
  dueDate: string;
  actorUserId?: string | null;
}) {
  return pool.query(
    `insert into revenues (
       tenant_id,
       company_id,
       company_name,
       contract_id,
       contract_name,
       competence_month,
       competence_year,
       competence_label,
       description,
       amount,
       due_date,
       received_at,
       status,
       source_type,
       created_by_user_id,
       updated_by_user_id
      )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, ($11::date)::timestamptz, 'received', 'contract', $12, $12)
     on conflict (tenant_id, contract_id, competence_month, competence_year) do nothing
     returning id`,
    [
      params.tenantId,
      params.companyId,
      params.companyName,
      params.contractId,
      params.contractName,
      params.competenceMonth,
      params.competenceYear,
      params.competenceLabel,
      params.description,
      params.amount,
      params.dueDate,
      params.actorUserId || null,
    ]
  );
}

export function listFreightsForRevenueSync(tenantId: string) {
  return pool.query<FreightRevenueSeedRow>(
    `select id, plate, contract_id, contract_name, billing_type, date, route, amount
     from freights
     where tenant_id = $1`,
    [tenantId]
  );
}

export function deleteFreightRevenue(tenantId: string, freightId: string) {
  return pool.query(
    `delete from revenues
     where tenant_id = $1
       and freight_id = $2`,
    [tenantId, freightId]
  );
}

export async function findLinkedContract(tenantId: string, contractId: string) {
  const result = await pool.query<FreightLinkedContractRow>(
    `select id, company_id, company_name, contract_name
     from contracts
     where tenant_id = $1
       and id = $2
     limit 1`,
    [tenantId, contractId]
  );

  return result.rows[0] || null;
}

export function upsertFreightRevenue(params: {
  tenantId: string;
  companyId: string | null;
  companyName: string;
  contractId: string | null;
  contractName: string;
  freightId: string;
  competenceMonth: number;
  competenceYear: number;
  competenceLabel: string;
  description: string;
  amount: number;
  dueDate: string;
  actorUserId?: string | null;
}) {
  return pool.query(
    `insert into revenues (
       tenant_id,
       company_id,
       company_name,
       contract_id,
       contract_name,
       freight_id,
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
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending', 'freight', $13, $14)
     on conflict (freight_id) where freight_id is not null
     do update set
       company_id = excluded.company_id,
       company_name = excluded.company_name,
       contract_id = excluded.contract_id,
       contract_name = excluded.contract_name,
       competence_month = excluded.competence_month,
       competence_year = excluded.competence_year,
       competence_label = excluded.competence_label,
       description = excluded.description,
       amount = excluded.amount,
       due_date = excluded.due_date,
       updated_by_user_id = excluded.updated_by_user_id,
       updated_at = now()`,
    [
      params.tenantId,
      params.companyId,
      params.companyName,
      params.contractId,
      params.contractName,
      params.freightId,
      params.competenceMonth,
      params.competenceYear,
      params.competenceLabel,
      params.description,
      params.amount,
      params.dueDate,
      params.actorUserId || null,
      params.actorUserId || null,
    ]
  );
}

export function listRevenuesByTenant(tenantId: string) {
  return pool.query<RevenueRow>(
    `select id,
            display_id,
            company_id,
            company_name,
            contract_id,
            contract_name,
            freight_id,
            competence_month,
            competence_year,
            competence_label,
            description,
            amount,
            due_date,
            status,
            source_type,
            charge_reference,
            charge_generated_at,
            received_at,
            created_at
     from revenues
     where tenant_id = $1
     order by competence_year desc, competence_month desc, created_at desc`,
    [tenantId]
  );
}

export function markRevenueAsCharged(chargeReference: string, actorUserId: string | undefined, revenueId: string, tenantId: string | undefined) {
  return pool.query<RevenueRow>(
    `update revenues
     set status = case when status = 'received' then status else 'billed' end,
         charge_reference = coalesce(charge_reference, $1),
         charge_generated_at = coalesce(charge_generated_at, now()),
         updated_by_user_id = $2,
         updated_at = now()
     where id = $3
       and tenant_id = $4
       and status in ('pending', 'overdue')
     returning id,
               display_id,
               company_id,
               company_name,
               contract_id,
               contract_name,
               freight_id,
               competence_month,
               competence_year,
               competence_label,
               description,
               amount,
               due_date,
               status,
               source_type,
               charge_reference,
               charge_generated_at,
               received_at,
               created_at`,
    [chargeReference, actorUserId, revenueId, tenantId]
  );
}

export function markRevenueAsReceived(actorUserId: string | undefined, revenueId: string, tenantId: string | undefined) {
  return pool.query<RevenueRow>(
    `update revenues
     set status = 'received',
         received_at = now(),
         updated_by_user_id = $1,
         updated_at = now()
     where id = $2
       and tenant_id = $3
       and status in ('pending', 'billed', 'overdue')
     returning id,
               display_id,
               company_id,
               company_name,
               contract_id,
               contract_name,
               freight_id,
               competence_month,
               competence_year,
               competence_label,
               description,
               amount,
               due_date,
               status,
               source_type,
               charge_reference,
               charge_generated_at,
               received_at,
               created_at`,
    [actorUserId, revenueId, tenantId]
  );
}

export function markRevenueAsOverdue(actorUserId: string | undefined, revenueId: string, tenantId: string | undefined) {
  return pool.query<RevenueRow>(
    `update revenues
     set status = case when status = 'received' then status else 'overdue' end,
         updated_by_user_id = $1,
         updated_at = now()
     where id = $2
       and tenant_id = $3
       and status in ('pending', 'billed')
     returning id,
               display_id,
               company_id,
               company_name,
               contract_id,
               contract_name,
               freight_id,
               competence_month,
               competence_year,
               competence_label,
               description,
               amount,
               due_date,
               status,
               source_type,
               charge_reference,
               charge_generated_at,
               received_at,
               created_at`,
    [actorUserId, revenueId, tenantId]
  );
}
