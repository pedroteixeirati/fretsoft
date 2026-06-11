import type { PoolClient } from 'pg';
import { pool } from '../../../shared/infra/database/pool';
import type {
  ContractRevenueSeedRow,
  FreightLinkedContractRow,
  FreightRevenueSeedRow,
  RevenueRow,
  RevenueStatus,
} from '../dtos/revenue.types';

function db(client?: PoolClient) {
  return client || pool;
}

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
    `select id, plate, contract_id, contract_name, billing_type, date, origin, destination, amount
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
    `with payment_totals as (
       select tenant_id,
              revenue_id,
              coalesce(sum(amount) filter (where status = 'active'), 0) as received_amount,
              count(*) as payment_count,
              max(payment_date) filter (where status = 'active') as last_payment_at
       from revenue_payments
       where tenant_id = $1
       group by tenant_id, revenue_id
     )
     select r.id,
            r.display_id,
            r.company_id,
            r.company_name,
            r.contract_id,
            r.contract_name,
            r.freight_id,
            r.novalog_billing_id,
            r.novalog_billing_item_id,
            r.fiscal_document_id,
            r.competence_month,
            r.competence_year,
            r.competence_label,
            r.description,
            r.amount,
            r.due_date,
            r.status,
            r.source_type,
            r.charge_reference,
            r.charge_generated_at,
            r.received_at,
            case when r.status = 'received' and p.revenue_id is null then r.amount else coalesce(p.received_amount, 0) end as received_amount,
            greatest(r.amount - case when r.status = 'received' and p.revenue_id is null then r.amount else coalesce(p.received_amount, 0) end, 0) as balance_amount,
            coalesce(p.payment_count, 0) as payment_count,
            p.last_payment_at,
            r.created_at
     from revenues r
     left join payment_totals p on p.tenant_id = r.tenant_id and p.revenue_id = r.id
     where r.tenant_id = $1
     order by r.competence_year desc, r.competence_month desc, r.created_at desc`,
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
               novalog_billing_id,
               novalog_billing_item_id,
               fiscal_document_id,
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
               novalog_billing_id,
               novalog_billing_item_id,
               fiscal_document_id,
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
               novalog_billing_id,
               novalog_billing_item_id,
               fiscal_document_id,
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

export function updateNovalogBillingRevenueStatus(revenueId: string, tenantId: string, status: RevenueStatus, actorUserId?: string, client?: PoolClient) {
  return db(client).query<RevenueRow>(
    `update revenues
     set status = $1,
         received_at = case when $1 = 'received' then coalesce(received_at, now()) else received_at end,
         updated_by_user_id = $2,
         updated_at = now()
     where id = $3
       and tenant_id = $4
       and source_type = 'novalog_billing_item'
       and ($1 <> 'canceled' or status not in ('received', 'partially_received'))
     returning id,
               display_id,
               company_id,
               company_name,
               contract_id,
               contract_name,
               freight_id,
               novalog_billing_id,
               novalog_billing_item_id,
               fiscal_document_id,
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
    [status, actorUserId || null, revenueId, tenantId]
  );
}

export function updateNovalogBillingRevenueFromItem(params: {
  revenueId: string;
  tenantId: string;
  companyId: string;
  companyName: string;
  billingId: string;
  billingItemId: string;
  fiscalDocumentId?: string | null;
  competenceMonth: number;
  competenceYear: number;
  competenceLabel: string;
  description: string;
  amount: number;
  dueDate: string;
  actorUserId?: string | null;
}, client?: PoolClient) {
  return db(client).query<RevenueRow>(
    `update revenues
     set company_id = $1,
         company_name = $2,
         novalog_billing_id = $3,
         novalog_billing_item_id = $4,
         fiscal_document_id = $5,
         competence_month = $6,
         competence_year = $7,
         competence_label = $8,
         description = $9,
         amount = $10,
         due_date = $11,
         updated_by_user_id = $12,
         updated_at = now()
     where id = $13
       and tenant_id = $14
       and source_type = 'novalog_billing_item'
       and status not in ('received', 'partially_received')
     returning id,
               display_id,
               company_id,
               company_name,
               contract_id,
               contract_name,
               freight_id,
               novalog_billing_id,
               novalog_billing_item_id,
               fiscal_document_id,
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
    [
      params.companyId,
      params.companyName,
      params.billingId,
      params.billingItemId,
      params.fiscalDocumentId || null,
      params.competenceMonth,
      params.competenceYear,
      params.competenceLabel,
      params.description,
      params.amount,
      params.dueDate,
      params.actorUserId || null,
      params.revenueId,
      params.tenantId,
    ],
  );
}
