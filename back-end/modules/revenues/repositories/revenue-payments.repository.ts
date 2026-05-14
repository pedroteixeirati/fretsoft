import type { PoolClient } from 'pg';
import { pool } from '../../../shared/infra/database/pool';
import type { RevenuePaymentRow, RevenueRow, RevenueStatus } from '../dtos/revenue.types';

function db(client?: PoolClient) {
  return client || pool;
}

export function getRevenuePoolClient() {
  return pool.connect();
}

export function findRevenueByIdForUpdate(revenueId: string, tenantId: string, client: PoolClient) {
  return client.query<RevenueRow>(
    `select id,
            display_id,
            company_id,
            company_name,
            contract_id,
            contract_name,
            freight_id,
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
            charge_reference,
            charge_generated_at,
            received_at,
            created_at
     from revenues
     where id = $1
       and tenant_id = $2
     for update`,
    [revenueId, tenantId],
  );
}

export function listRevenuePaymentsByRevenue(revenueId: string, tenantId: string, client?: PoolClient) {
  return db(client).query<RevenuePaymentRow>(
    `select id,
            tenant_id,
            revenue_id,
            amount,
            payment_date,
            notes,
            status,
            reversed_at,
            reversal_reason,
            created_at
     from revenue_payments
     where revenue_id = $1
       and tenant_id = $2
     order by payment_date desc, created_at desc`,
    [revenueId, tenantId],
  );
}

export async function sumRevenuePayments(revenueId: string, tenantId: string, client: PoolClient) {
  const result = await client.query<{ total: string }>(
    `select coalesce(sum(amount), 0)::text as total
     from revenue_payments
     where revenue_id = $1
       and tenant_id = $2
       and status = 'active'`,
    [revenueId, tenantId],
  );

  return Number(result.rows[0]?.total || 0);
}

export function findRevenuePaymentByIdForUpdate(paymentId: string, revenueId: string, tenantId: string, client: PoolClient) {
  return client.query<RevenuePaymentRow>(
    `select id,
            tenant_id,
            revenue_id,
            amount,
            payment_date,
            notes,
            status,
            reversed_at,
            reversal_reason,
            created_at
     from revenue_payments
     where id = $1
       and revenue_id = $2
       and tenant_id = $3
     for update`,
    [paymentId, revenueId, tenantId],
  );
}

export function insertRevenuePayment(params: {
  tenantId: string;
  revenueId: string;
  amount: number;
  paymentDate: string;
  notes?: string | null;
  actorUserId?: string | null;
}, client: PoolClient) {
  return client.query<RevenuePaymentRow>(
    `insert into revenue_payments (
       tenant_id,
       revenue_id,
       amount,
       payment_date,
       notes,
       created_by_user_id
     )
     values ($1, $2, $3, $4, $5, $6)
     returning id,
               tenant_id,
               revenue_id,
               amount,
               payment_date,
               notes,
               status,
               reversed_at,
               reversal_reason,
               created_at`,
    [
      params.tenantId,
      params.revenueId,
      params.amount,
      params.paymentDate,
      params.notes || null,
      params.actorUserId || null,
    ],
  );
}

export function reverseRevenuePayment(params: {
  paymentId: string;
  revenueId: string;
  tenantId: string;
  reason: string;
  actorUserId?: string | null;
}, client: PoolClient) {
  return client.query<RevenuePaymentRow>(
    `update revenue_payments
     set status = 'reversed',
         reversed_at = now(),
         reversed_by_user_id = $1,
         reversal_reason = $2
     where id = $3
       and revenue_id = $4
       and tenant_id = $5
       and status = 'active'
     returning id,
               tenant_id,
               revenue_id,
               amount,
               payment_date,
               notes,
               status,
               reversed_at,
               reversal_reason,
               created_at`,
    [
      params.actorUserId || null,
      params.reason,
      params.paymentId,
      params.revenueId,
      params.tenantId,
    ],
  );
}

export function updateRevenuePaymentState(params: {
  revenueId: string;
  tenantId: string;
  status: RevenueStatus;
  actorUserId?: string | null;
}, client: PoolClient) {
  return client.query<RevenueRow>(
    `update revenues
     set status = $1,
         received_at = case when $1 = 'received' then coalesce(received_at, now()) when $1 in ('pending', 'billed', 'partially_received', 'overdue') then null else received_at end,
         updated_by_user_id = $2,
         updated_at = now()
     where id = $3
       and tenant_id = $4
     returning id,
               display_id,
               company_id,
               company_name,
               contract_id,
               contract_name,
               freight_id,
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
               charge_reference,
               charge_generated_at,
               received_at,
               created_at`,
    [params.status, params.actorUserId || null, params.revenueId, params.tenantId],
  );
}
