import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaSource = readFileSync(resolve(process.cwd(), 'back-end/schema.sql'), 'utf8');
const expensesServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/expenses/services/expenses.service.ts'), 'utf8');
const expensesControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/expenses/controllers/expenses.controller.ts'), 'utf8');
const expensesRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/expenses/repositories/expenses.repository.ts'), 'utf8');

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

test('repositorio de expenses consulta e persiste metadados financeiros na tabela do dominio', () => {
  assert.match(expensesRepositorySource, /from expenses[\s\S]*where tenant_id = \$1[\s\S]*order by date desc, time desc/i);
  assert.match(expensesRepositorySource, /insert into expenses[\s\S]*payment_required[\s\S]*financial_status[\s\S]*linked_payable_id/i);
  assert.match(expensesRepositorySource, /update expenses[\s\S]*payment_required = \$12[\s\S]*linked_payable_id = \$16/i);
  assert.match(expensesRepositorySource, /select id,[\s\S]*linked_payable_id,[\s\S]*receipt_url,[\s\S]*observations/i);
});

test('custos operacionais agora orquestram payables diretamente no service do dominio', () => {
  assert.match(expensesServiceSource, /export async function createExpense\(auth: AuthContext \| undefined, body: ExpenseInput\)/);
  assert.match(expensesServiceSource, /await syncExpensePayable\(\{[\s\S]*id: row\.id,[\s\S]*\.\.\.mapped,[\s\S]*\}, tenantId, auth\?\.userId\);/i);
  assert.match(expensesServiceSource, /return getFreshExpenseOrFallback\(tenantId, row\.id, mapped\);/);
  assert.match(expensesServiceSource, /await removeExpensePayable\(id, tenantId\);/);
});

test('controller de expenses usa service explicito em vez do pipeline generico', () => {
  assert.match(expensesControllerSource, /serializeExpenses\(await listExpenses\(req\.auth\)\)/);
  assert.match(expensesControllerSource, /serializeExpense\(await createExpense\(req\.auth, req\.body\)\)/);
  assert.doesNotMatch(expensesControllerSource, /createResourceByConfig|listResourcesByConfig|updateResourceByConfig|removeResourceByConfig/);
});
