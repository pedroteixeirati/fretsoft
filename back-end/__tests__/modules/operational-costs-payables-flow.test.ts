import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readModule(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8');
}

const resourcesServiceSource = readModule('back-end/modules/resources/services/resources.service.ts');
const payablesServiceSource = readModule('back-end/modules/payables/services/payables.service.ts');
const payablesRepositorySource = readModule('back-end/modules/payables/repositories/payables.repository.ts');
const expensesRepositorySource = readModule('back-end/modules/expenses/repositories/expenses.repository.ts');

test('fluxo de criacao sincroniza custo operacional com conta a pagar quando paymentRequired estiver ativo', () => {
  assert.match(resourcesServiceSource, /await syncExpenseIfNeeded\(resourceName, mapped, auth\?\.userId, auth\?\.tenantId\);/);
  assert.match(payablesServiceSource, /if \(!expense\.paymentRequired\) \{/);
  assert.match(payablesServiceSource, /const payload = await validatePayablePayload\(buildExpensePayableInput\(expense\), tenantId\);/);
  assert.match(payablesServiceSource, /const existing = await findPayableBySource\('expense', expense\.id, tenantId\);/);
  assert.match(payablesServiceSource, /: await createTenantPayable\(payload, tenantId, userId\);/);
  assert.match(payablesServiceSource, /await syncExpensePayableLink\(expense\.id, tenantId, row\.id, row\.status, row\.paid_at \|\| ''\)/);
});

test('fluxo de atualizacao reaproveita a mesma origem expense e nao cria duplicidade financeira', () => {
  assert.match(payablesRepositorySource, /where tenant_id = \$1\s+and source_type = \$2\s+and source_id = \$3\s+limit 1/);
  assert.match(payablesServiceSource, /const row = existing\s+\? await updateTenantPayable\(existing\.id, payload, tenantId, userId\)\s+: await createTenantPayable\(payload, tenantId, userId\);/);
});

test('fluxo de desligar obrigacao financeira remove a conta a pagar vinculada e limpa o espelho do custo', () => {
  assert.match(payablesServiceSource, /if \(!expense\.paymentRequired\) \{[\s\S]*await deletePayableBySource\('expense', expense\.id, tenantId\);[\s\S]*await syncExpensePayableLink\(expense\.id, tenantId, null, 'none'\);[\s\S]*return null;?/);
  assert.match(resourcesServiceSource, /if \(resourceName === 'expenses'\) \{[\s\S]*await removeExpensePayable\(id, auth\?\.tenantId\);[\s\S]*\}/);
});

test('fluxo de pagamento e atraso propaga o estado financeiro de volta para o custo operacional de origem', () => {
  assert.match(payablesServiceSource, /if \(row\?\.source_type === 'expense' && row\.source_id && tenantId\) \{[\s\S]*syncExpensePayableLink\(row\.source_id, tenantId, row\.id, 'paid', row\.paid_at \|\| ''\)/);
  assert.match(payablesServiceSource, /if \(row\?\.source_type === 'expense' && row\.source_id && tenantId\) \{[\s\S]*syncExpensePayableLink\(row\.source_id, tenantId, row\.id, 'overdue'\)/);
  assert.match(expensesRepositorySource, /set linked_payable_id = \$1,\s+financial_status = \$2,\s+paid_at = \$3,\s+updated_at = now\(\)/);
  assert.match(expensesRepositorySource, /\[linkedPayableId, financialStatus, paidAt \|\| null, expenseId, tenantId\]/);
});

test('fluxo financeiro preserva contexto operacional ao transportar descricao comprovante e vencimento do custo para a conta', () => {
  assert.match(payablesServiceSource, /description: `\$\{expense\.category\} - \$\{expense\.provider\}`/);
  assert.match(payablesServiceSource, /dueDate: expense\.dueDate \|\| expense\.costDate \|\| expense\.date,/);
  assert.match(payablesServiceSource, /proofUrl: expense\.receiptUrl \|\| '',/);
  assert.match(payablesServiceSource, /notes: expense\.observations \|\| '',/);
  assert.match(payablesServiceSource, /status: expense\.financialStatus === 'none' \? 'open' : expense\.financialStatus,/);
});
