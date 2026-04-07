import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaSource = readFileSync(resolve(process.cwd(), 'back-end/schema.sql'), 'utf8');
const expensesServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/expenses/services/expenses.service.ts'), 'utf8');
const expensesResourceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/expenses/expenses.resource.ts'), 'utf8');
const resourcesServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/resources/services/resources.service.ts'), 'utf8');

test('schema prepara expenses para o papel de custo operacional com metadados financeiros opcionais', () => {
  assert.match(schemaSource, /create table if not exists expenses \([\s\S]*cost_date text/i);
  assert.match(schemaSource, /payment_required boolean not null default false/i);
  assert.match(schemaSource, /financial_status text not null default 'none'/i);
  assert.match(schemaSource, /due_date text/i);
  assert.match(schemaSource, /paid_at text/i);
  assert.match(schemaSource, /linked_payable_id uuid/i);
  assert.match(schemaSource, /contract_id uuid references contracts\(id\) on delete set null/i);
  assert.match(schemaSource, /freight_id uuid references freights\(id\) on delete set null/i);
  assert.match(schemaSource, /receipt_url text/i);
  assert.match(schemaSource, /update expenses set cost_date = date where cost_date is null/i);
});

test('validacao de expenses define defaults coerentes para o fluxo operacional antes de payables', () => {
  assert.match(expensesServiceSource, /const costDate = normalizeOptionalText\(body\.costDate\) \|\| date;/i);
  assert.match(expensesServiceSource, /const paymentRequired = parseBooleanInput\(body\.paymentRequired\);/i);
  assert.match(expensesServiceSource, /let financialStatus: ExpenseFinancialStatus = paymentRequired[\s\S]*'open'[\s\S]*: 'none';/i);
  assert.match(expensesServiceSource, /let dueDate = paymentRequired \? \(normalizeOptionalText\(body\.dueDate\) \|\| costDate\) : '';/i);
  assert.match(expensesServiceSource, /if \(!paymentRequired\) \{[\s\S]*financialStatus = 'none';[\s\S]*dueDate = '';[\s\S]*paidAt = '';[\s\S]*linkedPayableId = null;[\s\S]*\}/i);
  assert.match(expensesServiceSource, /if \(paymentRequired && financialStatus === 'paid' && !paidAt\) \{[\s\S]*paidAt = dueDate \|\| costDate;[\s\S]*\}/i);
});

test('recurso expenses expoe novos campos preparatorios para futuras contas a pagar', () => {
  assert.match(expensesResourceSource, /\{ api: 'costDate', db: 'cost_date' \}/i);
  assert.match(expensesResourceSource, /\{ api: 'paymentRequired', db: 'payment_required' \}/i);
  assert.match(expensesResourceSource, /\{ api: 'financialStatus', db: 'financial_status' \}/i);
  assert.match(expensesResourceSource, /\{ api: 'dueDate', db: 'due_date' \}/i);
  assert.match(expensesResourceSource, /\{ api: 'paidAt', db: 'paid_at' \}/i);
  assert.match(expensesResourceSource, /\{ api: 'linkedPayableId', db: 'linked_payable_id' \}/i);
  assert.match(expensesResourceSource, /\{ api: 'contractId', db: 'contract_id' \}/i);
  assert.match(expensesResourceSource, /\{ api: 'freightId', db: 'freight_id' \}/i);
  assert.match(expensesResourceSource, /\{ api: 'receiptUrl', db: 'receipt_url' \}/i);
});

test('custos operacionais podem gerar e remover conta a pagar de forma opcional', () => {
  assert.match(resourcesServiceSource, /if \(resourceName !== 'expenses'\) \{[\s\S]*return;[\s\S]*\}/i);
  assert.match(resourcesServiceSource, /await syncExpensePayable\(\{[\s\S]*paymentRequired: Boolean\(row\.paymentRequired\),/i);
  assert.match(resourcesServiceSource, /resourceName === 'expenses'[\s\S]*getUpdatedExpenseResource/i);
  assert.match(resourcesServiceSource, /if \(resourceName === 'expenses'\) \{[\s\S]*await removeExpensePayable\(id, auth\?\.tenantId\);[\s\S]*\}/i);
});
