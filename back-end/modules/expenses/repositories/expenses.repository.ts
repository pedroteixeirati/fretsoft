import { pool } from '../../../shared/infra/database/pool';
import type { ExpenseFinancialStatus } from '../dtos/expense.types';

export type ExpenseRow = {
  id: string;
  display_id: number | null;
  tenant_id: string;
  date: string;
  time: string;
  cost_date: string;
  vehicle_id: string;
  vehicle_name: string;
  provider: string;
  category: string;
  quantity: string;
  amount: string | number;
  odometer: string;
  status: 'approved' | 'review' | 'pending';
  payment_required: boolean;
  financial_status: ExpenseFinancialStatus;
  due_date: string | null;
  paid_at: string | null;
  linked_payable_id: string | null;
  contract_id: string | null;
  freight_id: string | null;
  receipt_url: string | null;
  observations: string | null;
};

export async function findTenantVehicleForExpense(vehicleId: string, tenantId: string) {
  const result = await pool.query<{ id: string; name: string }>(
    `select id, name
     from vehicles
     where id = $1
       and tenant_id = $2
     limit 1`,
    [vehicleId, tenantId]
  );

  return result.rows[0] || null;
}

export async function listTenantExpenses(tenantId: string) {
  const result = await pool.query<ExpenseRow>(
    `select id,
            display_id,
            tenant_id,
            date,
            time,
            cost_date,
            vehicle_id,
            vehicle_name,
            provider,
            category,
            quantity,
            amount,
            odometer,
            status,
            payment_required,
            financial_status,
            due_date,
            paid_at,
            linked_payable_id,
            contract_id,
            freight_id,
            receipt_url,
            observations
     from expenses
     where tenant_id = $1
     order by date desc, time desc`,
    [tenantId]
  );

  return result.rows;
}

export async function findTenantExpenseById(id: string, tenantId: string) {
  const result = await pool.query<ExpenseRow>(
    `select id,
            display_id,
            tenant_id,
            date,
            time,
            cost_date,
            vehicle_id,
            vehicle_name,
            provider,
            category,
            quantity,
            amount,
            odometer,
            status,
            payment_required,
            financial_status,
            due_date,
            paid_at,
            linked_payable_id,
            contract_id,
            freight_id,
            receipt_url,
            observations
     from expenses
     where id = $1
       and tenant_id = $2
     limit 1`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}

export async function insertTenantExpense(
  payload: {
    date: string;
    time: string;
    costDate: string;
    vehicleId: string;
    vehicleName: string;
    provider: string;
    category: string;
    quantity: string;
    amount: number;
    odometer: string;
    status: 'approved' | 'review' | 'pending';
    paymentRequired: boolean;
    financialStatus: ExpenseFinancialStatus;
    dueDate: string;
    paidAt: string;
    linkedPayableId: string | null;
    contractId: string | null;
    freightId: string | null;
    receiptUrl: string;
    observations: string;
  },
  tenantId: string,
  userId?: string
) {
  const result = await pool.query<ExpenseRow>(
    `insert into expenses (
       tenant_id,
       created_by_user_id,
       updated_by_user_id,
       date,
       time,
       cost_date,
       vehicle_id,
       vehicle_name,
       provider,
       category,
       quantity,
       amount,
       odometer,
       status,
       payment_required,
       financial_status,
       due_date,
       paid_at,
       linked_payable_id,
       contract_id,
       freight_id,
       receipt_url,
       observations
     )
     values ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
     returning id,
               display_id,
               tenant_id,
               date,
               time,
               cost_date,
               vehicle_id,
               vehicle_name,
               provider,
               category,
               quantity,
               amount,
               odometer,
               status,
               payment_required,
               financial_status,
               due_date,
               paid_at,
               linked_payable_id,
               contract_id,
               freight_id,
               receipt_url,
               observations`,
    [
      tenantId,
      userId || null,
      payload.date,
      payload.time,
      payload.costDate,
      payload.vehicleId,
      payload.vehicleName,
      payload.provider,
      payload.category,
      payload.quantity,
      payload.amount,
      payload.odometer,
      payload.status,
      payload.paymentRequired,
      payload.financialStatus,
      payload.dueDate || null,
      payload.paidAt || null,
      payload.linkedPayableId,
      payload.contractId,
      payload.freightId,
      payload.receiptUrl || null,
      payload.observations,
    ]
  );

  return result.rows[0] || null;
}

export async function updateTenantExpense(
  id: string,
  payload: {
    date: string;
    time: string;
    costDate: string;
    vehicleId: string;
    vehicleName: string;
    provider: string;
    category: string;
    quantity: string;
    amount: number;
    odometer: string;
    status: 'approved' | 'review' | 'pending';
    paymentRequired: boolean;
    financialStatus: ExpenseFinancialStatus;
    dueDate: string;
    paidAt: string;
    linkedPayableId: string | null;
    contractId: string | null;
    freightId: string | null;
    receiptUrl: string;
    observations: string;
  },
  tenantId: string,
  userId?: string
) {
  const result = await pool.query<ExpenseRow>(
    `update expenses
     set date = $1,
         time = $2,
         cost_date = $3,
         vehicle_id = $4,
         vehicle_name = $5,
         provider = $6,
         category = $7,
         quantity = $8,
         amount = $9,
         odometer = $10,
         status = $11,
         payment_required = $12,
         financial_status = $13,
         due_date = $14,
         paid_at = $15,
         linked_payable_id = $16,
         contract_id = $17,
         freight_id = $18,
         receipt_url = $19,
         observations = $20,
         updated_by_user_id = $21,
         updated_at = now()
     where id = $22
       and tenant_id = $23
     returning id,
               display_id,
               tenant_id,
               date,
               time,
               cost_date,
               vehicle_id,
               vehicle_name,
               provider,
               category,
               quantity,
               amount,
               odometer,
               status,
               payment_required,
               financial_status,
               due_date,
               paid_at,
               linked_payable_id,
               contract_id,
               freight_id,
               receipt_url,
               observations`,
    [
      payload.date,
      payload.time,
      payload.costDate,
      payload.vehicleId,
      payload.vehicleName,
      payload.provider,
      payload.category,
      payload.quantity,
      payload.amount,
      payload.odometer,
      payload.status,
      payload.paymentRequired,
      payload.financialStatus,
      payload.dueDate || null,
      payload.paidAt || null,
      payload.linkedPayableId,
      payload.contractId,
      payload.freightId,
      payload.receiptUrl || null,
      payload.observations,
      userId || null,
      id,
      tenantId,
    ]
  );

  return result.rows[0] || null;
}

export async function deleteTenantExpense(id: string, tenantId: string) {
  const result = await pool.query<{ id: string }>(
    `delete from expenses
     where id = $1
       and tenant_id = $2
     returning id`,
    [id, tenantId]
  );

  return result.rows[0] || null;
}

export async function syncExpensePayableLink(
  expenseId: string,
  tenantId: string,
  linkedPayableId: string | null,
  financialStatus: ExpenseFinancialStatus,
  paidAt = ''
) {
  await pool.query(
    `update expenses
     set linked_payable_id = $1,
         financial_status = $2,
         paid_at = $3,
         updated_at = now()
     where id = $4
       and tenant_id = $5`,
    [linkedPayableId, financialStatus, paidAt || null, expenseId, tenantId]
  );
}
