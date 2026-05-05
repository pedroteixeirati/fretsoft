import type { PoolClient } from 'pg';
import { pool } from '../../../shared/infra/database/pool';
import type { NovalogBillingItemPayload, NovalogBillingItemStatus, NovalogBillingPayload, NovalogBillingStatus } from '../dtos/novalog-billing.types';

export type NovalogBillingRow = {
  id: string;
  display_id: number | null;
  tenant_id: string;
  company_id: string;
  company_name: string;
  billing_date: string;
  due_date: string;
  status: NovalogBillingStatus;
  notes: string | null;
  created_at: string;
  cte_count: string | number;
  total_amount: string | number;
  received_amount: string | number;
  open_amount: string | number;
  overdue_amount: string | number;
};

export type NovalogBillingItemRow = {
  id: string;
  display_id: number | null;
  tenant_id: string;
  billing_id: string;
  cte_number: string;
  cte_key: string | null;
  issue_date: string | null;
  due_date: string | null;
  origin_name: string | null;
  destination_name: string | null;
  amount: string | number;
  status: NovalogBillingItemStatus;
  received_at: string | null;
  notes: string | null;
  linked_revenue_id: string | null;
  created_at: string;
};

export type CompanyForBillingRow = {
  id: string;
  company_name: string;
};

const billingAggregateSelect = `select b.id,
       b.display_id,
       b.tenant_id,
       b.company_id,
       b.company_name,
       b.billing_date,
       b.due_date,
       b.status,
       b.notes,
       b.created_at,
       count(i.id) filter (where i.status <> 'canceled') as cte_count,
       coalesce(sum(i.amount) filter (where i.status <> 'canceled'), 0) as total_amount,
       coalesce(sum(i.amount) filter (where i.status = 'received'), 0) as received_amount,
       coalesce(sum(i.amount) filter (where i.status in ('pending', 'billed')), 0) as open_amount,
       coalesce(sum(i.amount) filter (where i.status = 'overdue'), 0) as overdue_amount
from novalog_billings b
left join novalog_billing_items i on i.billing_id = b.id and i.tenant_id = b.tenant_id`;

const billingGroupBy = `group by b.id,
         b.display_id,
         b.tenant_id,
         b.company_id,
         b.company_name,
         b.billing_date,
         b.due_date,
         b.status,
         b.notes,
         b.created_at`;

const itemColumns = `id,
       display_id,
       tenant_id,
       billing_id,
       cte_number,
       cte_key,
       issue_date,
       due_date,
       origin_name,
       destination_name,
       amount,
       status,
       received_at,
       notes,
       linked_revenue_id,
       created_at`;

function db(client?: PoolClient) {
  return client || pool;
}

export async function findCompanyForNovalogBilling(companyId: string, tenantId: string) {
  const result = await pool.query<CompanyForBillingRow>(
    `select id, coalesce(nullif(trade_name, ''), corporate_name) as company_name
     from companies
     where id = $1
       and tenant_id = $2
       and status = 'active'
     limit 1`,
    [companyId, tenantId],
  );

  return result.rows[0] || null;
}

export async function listTenantNovalogBillings(tenantId: string) {
  const result = await pool.query<NovalogBillingRow>(
    `${billingAggregateSelect}
     where b.tenant_id = $1
     ${billingGroupBy}
     order by b.billing_date desc, b.created_at desc`,
    [tenantId],
  );

  return result.rows;
}

export async function findTenantNovalogBilling(id: string, tenantId: string, client?: PoolClient) {
  const result = await db(client).query<NovalogBillingRow>(
    `${billingAggregateSelect}
     where b.id = $1
       and b.tenant_id = $2
     ${billingGroupBy}
     limit 1`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}

export async function listTenantNovalogBillingItems(billingId: string, tenantId: string, client?: PoolClient) {
  const result = await db(client).query<NovalogBillingItemRow>(
    `select ${itemColumns}
     from novalog_billing_items
     where billing_id = $1
       and tenant_id = $2
       and status <> 'canceled'
     order by display_id asc, created_at asc`,
    [billingId, tenantId],
  );

  return result.rows;
}

export async function insertTenantNovalogBilling(payload: NovalogBillingPayload, tenantId: string, userId?: string) {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const billingResult = await client.query<{ id: string }>(
      `insert into novalog_billings (
         tenant_id,
         company_id,
         company_name,
         billing_date,
         due_date,
         status,
         notes,
         created_by_user_id,
         updated_by_user_id
       )
       values ($1, $2, $3, $4, $5, 'draft', $6, $7, $7)
       returning id`,
      [
        tenantId,
        payload.companyId,
        payload.companyName,
        payload.billingDate,
        payload.dueDate,
        payload.notes,
        userId || null,
      ],
    );

    const billingId = billingResult.rows[0]?.id;
    for (const item of payload.items) {
      await insertTenantNovalogBillingItem(billingId, tenantId, item, userId, client);
    }

    await client.query('commit');
    return findTenantNovalogBilling(billingId, tenantId);
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function replaceTenantNovalogBillingItems(billingId: string, tenantId: string, items: NovalogBillingItemPayload[], userId?: string) {
  const client = await pool.connect();

  try {
    await client.query('begin');
    await client.query(
      `delete from novalog_billing_items
       where billing_id = $1
         and tenant_id = $2`,
      [billingId, tenantId],
    );

    for (const item of items) {
      await insertTenantNovalogBillingItem(billingId, tenantId, item, userId, client);
    }

    await client.query(
      `update novalog_billings
       set updated_by_user_id = $1,
           updated_at = now()
       where id = $2
         and tenant_id = $3`,
      [userId || null, billingId, tenantId],
    );

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

async function insertTenantNovalogBillingItem(billingId: string, tenantId: string, item: NovalogBillingItemPayload, userId?: string, client?: PoolClient) {
  return db(client).query(
    `insert into novalog_billing_items (
       tenant_id,
       billing_id,
       cte_number,
       cte_key,
       issue_date,
       due_date,
       origin_name,
       destination_name,
       amount,
       status,
       notes,
       created_by_user_id,
       updated_by_user_id
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, $11, $11)`,
    [
      tenantId,
      billingId,
      item.cteNumber,
      item.cteKey,
      item.issueDate,
      item.dueDate,
      item.originName,
      item.destinationName,
      item.amount,
      item.notes,
      userId || null,
    ],
  );
}

export function updateTenantNovalogBillingDraft(id: string, tenantId: string, payload: NovalogBillingPayload, userId?: string) {
  return pool.query(
    `update novalog_billings
     set company_id = $1,
         company_name = $2,
         billing_date = $3,
         due_date = $4,
         notes = $5,
         updated_by_user_id = $6,
         updated_at = now()
     where id = $7
       and tenant_id = $8
       and status = 'draft'`,
    [
      payload.companyId,
      payload.companyName,
      payload.billingDate,
      payload.dueDate,
      payload.notes,
      userId || null,
      id,
      tenantId,
    ],
  );
}

export function updateTenantNovalogBillingStatus(id: string, tenantId: string, status: NovalogBillingStatus, userId?: string, client?: PoolClient) {
  return db(client).query(
    `update novalog_billings
     set status = $1,
         updated_by_user_id = $2,
         updated_at = now()
     where id = $3
       and tenant_id = $4`,
    [status, userId || null, id, tenantId],
  );
}

export async function findTenantNovalogBillingItem(id: string, tenantId: string, client?: PoolClient) {
  const result = await db(client).query<NovalogBillingItemRow>(
    `select ${itemColumns}
     from novalog_billing_items
     where id = $1
       and tenant_id = $2
     limit 1`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}

export function updateTenantNovalogBillingItemStatus(id: string, tenantId: string, status: NovalogBillingItemStatus, userId?: string, client?: PoolClient) {
  return db(client).query<NovalogBillingItemRow>(
    `update novalog_billing_items
     set status = $1,
         received_at = case when $1 = 'received' then now() else received_at end,
         updated_by_user_id = $2,
         updated_at = now()
     where id = $3
       and tenant_id = $4
       and status <> 'canceled'
     returning ${itemColumns}`,
    [status, userId || null, id, tenantId],
  );
}

export function updateTenantNovalogBillingItem(id: string, tenantId: string, item: NovalogBillingItemPayload, userId?: string, client?: PoolClient) {
  return db(client).query<NovalogBillingItemRow>(
    `update novalog_billing_items
     set cte_number = $1,
         cte_key = $2,
         issue_date = $3,
         due_date = $4,
         origin_name = $5,
         destination_name = $6,
         amount = $7,
         notes = $8,
         updated_by_user_id = $9,
         updated_at = now()
     where id = $10
       and tenant_id = $11
       and status not in ('received', 'canceled')
     returning ${itemColumns}`,
    [
      item.cteNumber,
      item.cteKey,
      item.issueDate,
      item.dueDate,
      item.originName,
      item.destinationName,
      item.amount,
      item.notes,
      userId || null,
      id,
      tenantId,
    ],
  );
}

export async function countActiveTenantNovalogBillingItems(billingId: string, tenantId: string, client?: PoolClient) {
  const result = await db(client).query<{ total: string }>(
    `select count(*)::text as total
     from novalog_billing_items
     where billing_id = $1
       and tenant_id = $2
       and status <> 'canceled'`,
    [billingId, tenantId],
  );

  return Number(result.rows[0]?.total || 0);
}

export function linkRevenueToNovalogBillingItem(itemId: string, tenantId: string, revenueId: string, userId?: string, client?: PoolClient) {
  return db(client).query(
    `update novalog_billing_items
     set linked_revenue_id = $1,
         updated_by_user_id = $2,
         updated_at = now()
     where id = $3
       and tenant_id = $4`,
    [revenueId, userId || null, itemId, tenantId],
  );
}

export function updateNovalogBillingItemStatusByRevenue(revenueId: string, tenantId: string, status: NovalogBillingItemStatus, userId?: string) {
  return pool.query<NovalogBillingItemRow>(
    `update novalog_billing_items
     set status = $1,
         received_at = case when $1 = 'received' then coalesce(received_at, now()) else received_at end,
         updated_by_user_id = $2,
         updated_at = now()
     where linked_revenue_id = $3
       and tenant_id = $4
       and status <> 'canceled'
     returning ${itemColumns}`,
    [status, userId || null, revenueId, tenantId],
  );
}

export function getPoolClient() {
  return pool.connect();
}
