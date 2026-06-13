import { pool } from '../../../shared/infra/database/pool';

export type RecurringPayableRow = {
  id: string;
  display_id: number | string | null;
  tenant_id: string;
  description: string;
  provider_name: string | null;
  amount: string | number;
  due_day: number;
  starts_on: string | null;
  ends_on: string | null;
  status: 'active' | 'paused';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const recurringColumns = `
  id,
  display_id,
  tenant_id,
  description,
  provider_name,
  amount,
  due_day,
  to_char(starts_on, 'YYYY-MM-DD') as starts_on,
  to_char(ends_on, 'YYYY-MM-DD') as ends_on,
  status,
  notes,
  created_at,
  updated_at
`;

export async function listTenantRecurringPayables(tenantId?: string) {
  const result = await pool.query<RecurringPayableRow>(
    `select ${recurringColumns}
     from recurring_payables
     where tenant_id = $1
     order by status asc, due_day asc, description asc`,
    [tenantId],
  );

  return result.rows;
}

export async function listActiveRecurringPayablesForGeneration(referenceMonthStart: string, tenantId?: string) {
  const params: unknown[] = [referenceMonthStart];
  let tenantFilter = '';
  if (tenantId) {
    params.push(tenantId);
    tenantFilter = 'and tenant_id = $2';
  }

  const result = await pool.query<RecurringPayableRow>(
    `select ${recurringColumns}
     from recurring_payables
     where status = 'active'
       and (starts_on is null or date_trunc('month', starts_on) <= $1::date)
       and (ends_on is null or ends_on >= $1::date)
       ${tenantFilter}
     order by tenant_id, due_day asc`,
    params,
  );

  return result.rows;
}

export async function insertTenantRecurringPayable(
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const result = await pool.query<RecurringPayableRow>(
    `insert into recurring_payables (
      tenant_id,
      created_by_user_id,
      updated_by_user_id,
      description,
      provider_name,
      amount,
      due_day,
      starts_on,
      ends_on,
      status,
      notes
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    returning ${recurringColumns}`,
    [
      tenantId,
      userId || null,
      userId || null,
      payload.description,
      payload.providerName,
      payload.amount,
      payload.dueDay,
      payload.startsOn,
      payload.endsOn,
      payload.status,
      payload.notes,
    ],
  );

  return result.rows[0] || null;
}

export async function updateTenantRecurringPayable(
  id: string,
  payload: Record<string, unknown>,
  tenantId?: string,
  userId?: string,
) {
  const result = await pool.query<RecurringPayableRow>(
    `update recurring_payables
     set description = $1,
         provider_name = $2,
         amount = $3,
         due_day = $4,
         starts_on = $5,
         ends_on = $6,
         status = $7,
         notes = $8,
         updated_by_user_id = $9,
         updated_at = now()
     where id = $10
       and tenant_id = $11
     returning ${recurringColumns}`,
    [
      payload.description,
      payload.providerName,
      payload.amount,
      payload.dueDay,
      payload.startsOn,
      payload.endsOn,
      payload.status,
      payload.notes,
      userId || null,
      id,
      tenantId,
    ],
  );

  return result.rows[0] || null;
}

export async function deleteTenantRecurringPayable(id: string, tenantId?: string) {
  const result = await pool.query<{ id: string }>(
    `delete from recurring_payables
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId],
  );

  return result.rows[0] || null;
}

export async function insertGeneratedPayable(params: {
  tenantId: string;
  recurringPayableId: string;
  description: string;
  providerName: string | null;
  amount: number;
  dueDate: string;
  referenceMonth: string;
  notes: string | null;
  actorUserId?: string | null;
}) {
  return pool.query(
    `insert into payables (
       tenant_id,
       source_type,
       source_id,
       recurring_payable_id,
       description,
       provider_name,
       amount,
       due_date,
       status,
       reference_month,
       notes,
       created_by_user_id,
       updated_by_user_id
     )
     values ($1, 'manual', null, $2, $3, $4, $5, $6, 'open', $7, $8, $9, $9)
     on conflict (tenant_id, recurring_payable_id, reference_month)
       where recurring_payable_id is not null and reference_month is not null
       do nothing
     returning id`,
    [
      params.tenantId,
      params.recurringPayableId,
      params.description,
      params.providerName,
      params.amount,
      params.dueDate,
      params.referenceMonth,
      params.notes,
      params.actorUserId || null,
    ],
  );
}
