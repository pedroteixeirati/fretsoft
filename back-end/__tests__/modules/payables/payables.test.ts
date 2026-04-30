import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const payablesControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/payables/controllers/payables.controller.ts'), 'utf8');
const payablesServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/payables/services/payables.service.ts'), 'utf8');
const payablesRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/payables/repositories/payables.repository.ts'), 'utf8');
const payablesResourceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/payables/payables.resource.ts'), 'utf8');

test('payables permitem leitura ampla e restringem acoes ao financeiro', () => {
  assert.match(payablesResourceSource, /read: \['dev', 'owner', 'admin', 'financial', 'operational', 'driver', 'viewer'\]/);
  assert.match(payablesResourceSource, /create: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(payablesResourceSource, /update: \['dev', 'owner', 'admin', 'financial'\]/);
  assert.match(payablesResourceSource, /delete: \['dev', 'owner', 'admin', 'financial'\]/);
});

test('validacao de payables exige vencimento valor e origem coerente', () => {
  assert.match(payablesServiceSource, /if \(!\['expense', 'manual'\]\.includes\(sourceType\)\) throw payableErrors\.invalidSourceType\(\);/i);
  assert.match(payablesServiceSource, /if \(sourceType === 'expense' && !sourceId\) throw payableErrors\.expenseSourceRequiresId\(\);/i);
  assert.match(payablesServiceSource, /if \(!isPositiveNumber\(amount\)\) throw payableErrors\.invalidAmount\(\);/i);
  assert.match(payablesServiceSource, /if \(!isValidDate\(dueDate\)\) throw payableErrors\.invalidDueDate\(\);/i);
  assert.match(payablesServiceSource, /if \(status === 'paid' && !paidAt\) \{[\s\S]*paidAt = dueDate;[\s\S]*\}/i);
});

test('repositorio de payables suporta criacao listagem e transicoes financeiras minimas', () => {
  assert.match(payablesRepositorySource, /insert into payables \(/i);
  assert.match(payablesRepositorySource, /from payables[\s\S]*order by due_date asc, created_at desc/i);
  assert.match(payablesRepositorySource, /set status = 'paid',[\s\S]*where id = \$2[\s\S]*status in \('open', 'overdue'\)/i);
  assert.match(payablesRepositorySource, /set status = 'overdue',[\s\S]*where id = \$2[\s\S]*status = 'open'/i);
});

test('controller de payables expoe acoes de pagamento e atraso', () => {
  assert.match(payablesControllerSource, /router\.post\('\/payables\/:id\/pay'/);
  assert.match(payablesControllerSource, /router\.post\('\/payables\/:id\/overdue'/);
  assert.match(payablesControllerSource, /payPayable\(req\.params\.id, req\.auth\?\.tenantId, req\.auth\?\.userId\)/);
  assert.match(payablesControllerSource, /overduePayable\(req\.params\.id, req\.auth\?\.tenantId, req\.auth\?\.userId\)/);
});

test('sync de payables com custos operacionais cria atualiza e limpa a vinculacao por origem expense', () => {
  assert.match(payablesServiceSource, /export async function syncExpensePayable\(expense: ExpenseSeed, tenantId\?: string, userId\?: string\)/);
  assert.match(payablesServiceSource, /if \(!expense\.paymentRequired\) \{[\s\S]*deletePayableBySource\('expense', expense\.id, tenantId\)[\s\S]*syncExpensePayableLink\(expense\.id, tenantId, null, 'none'\)/i);
  assert.match(payablesServiceSource, /const existing = await findPayableBySource\('expense', expense\.id, tenantId\);/i);
  assert.match(payablesServiceSource, /await syncExpensePayableLink\(expense\.id, tenantId, row\.id, row\.status, row\.paid_at \|\| ''\)/i);
  assert.match(payablesServiceSource, /if \(row\?\.source_type === 'expense' && row\.source_id && tenantId\) \{[\s\S]*syncExpensePayableLink\(row\.source_id, tenantId, row\.id, 'paid', row\.paid_at \|\| ''\)/i);
});
