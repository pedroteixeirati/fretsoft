import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  addMonths,
  formatCompetenceLabel,
  formatDueDate,
  monthDiff,
  parseDateInput,
  shouldGenerateContractRevenue,
  startOfMonth,
} from '../../../modules/revenues/services/revenues-domain.ts';

const appSource = readFileSync(resolve(process.cwd(), 'back-end/app.ts'), 'utf8');
const freightsServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/freights/services/freights.service.ts'), 'utf8');
const revenuesServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/revenues/services/revenues.service.ts'), 'utf8');
const revenuesRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/revenues/repositories/revenues.repository.ts'), 'utf8');

test('gera receitas automaticas apenas para contratos recorrentes com valor mensal positivo', () => {
  assert.equal(shouldGenerateContractRevenue('recurring', 18000), true);
  assert.equal(shouldGenerateContractRevenue('recurring', 0), false);
  assert.equal(shouldGenerateContractRevenue('per_trip', 18000), false);
});

test('calcula intervalo mensal corretamente para competencias', () => {
  const start = startOfMonth(new Date('2026-01-15T00:00:00'));
  const end = startOfMonth(new Date('2026-04-01T00:00:00'));

  assert.equal(monthDiff(start, end), 3);
  assert.equal(addMonths(start, 2).toISOString().slice(0, 10), '2026-03-01');
});

test('gera vencimento limitado ao ultimo dia do mes', () => {
  const reference = new Date('2026-02-01T00:00:00');
  const startDate = parseDateInput('2026-01-31');

  assert.equal(formatDueDate(reference, startDate), '2026-02-28');
});

test('gera rotulo de competencia em portugues', () => {
  const label = formatCompetenceLabel(new Date('2026-04-01T00:00:00'));
  assert.match(label, /abril/i);
  assert.match(label, /2026/);
});

test('nao apaga historico de receitas ao interromper geracao recorrente', () => {
  assert.doesNotMatch(
    appSource,
    /delete from revenues[\s\S]*contract_id = \$2[\s\S]*source_type = 'contract'/i
  );
});

test('receitas recorrentes nascem pendentes com auditoria compativel', () => {
  assert.match(
    revenuesRepositorySource,
    /insert into revenues \([\s\S]*due_date,\s*status,\s*source_type,\s*created_by_user_id,\s*updated_by_user_id[\s\S]*values \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, 'pending', 'contract', \$12, \$12\)/i
  );
});

test('frete vinculado a contrato recorrente nao gera receita duplicada por viagem', () => {
  assert.match(
    revenuesServiceSource,
    /if \(freight\.billing_type === 'contract_recurring'\) \{[\s\S]*deleteFreightRevenue\(tenantId, freight\.id\)/i
  );
});

test('listagem e geracao manual nao criam receitas recorrentes de contrato fora do job', () => {
  assert.doesNotMatch(
    revenuesServiceSource,
    /export async function listTenantRevenues[\s\S]*generateMonthlyRevenuesForTenant/i
  );
  assert.doesNotMatch(
    revenuesServiceSource,
    /export async function generateTenantRevenues[\s\S]*generateMonthlyRevenuesForTenant/i
  );
});

test('job mensal cria receita recorrente recebida e ignora duplicidade da mesma competencia', () => {
  assert.match(
    revenuesRepositorySource,
    /insert into revenues \([\s\S]*due_date,\s*received_at,\s*status,\s*source_type,\s*created_by_user_id,\s*updated_by_user_id[\s\S]*values \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, \(\$11::date\)::timestamptz, 'received', 'contract', \$12, \$12\)[\s\S]*on conflict \(tenant_id, contract_id, competence_month, competence_year\) do nothing/i
  );
});

test('transicoes financeiras impedem cobranca e atraso em receitas concluidas', () => {
  assert.match(
    revenuesRepositorySource,
    /markRevenueAsCharged[\s\S]*where id = \$3[\s\S]*tenant_id = \$4[\s\S]*status in \('pending', 'overdue'\)/i
  );
  assert.match(
    revenuesRepositorySource,
    /markRevenueAsReceived[\s\S]*where id = \$2[\s\S]*tenant_id = \$3[\s\S]*status in \('pending', 'billed', 'overdue'\)/i
  );
  assert.match(
    revenuesRepositorySource,
    /markRevenueAsOverdue[\s\S]*where id = \$2[\s\S]*tenant_id = \$3[\s\S]*status in \('pending', 'billed'\)/i
  );
});

test('insert de receitas de frete possui a mesma quantidade de colunas e valores', () => {
  assert.match(
    revenuesRepositorySource,
    /insert into revenues \([\s\S]*freight_id,[\s\S]*updated_by_user_id[\s\S]*values \(\$1, \$2, \$3, \$4, \$5, \$6, \$7, \$8, \$9, \$10, \$11, \$12, 'pending', 'freight', \$13, \$14\)/i
  );
});

test('fretes vinculados a contrato validam valor conforme o tipo de remuneracao', () => {
  assert.match(freightsServiceSource, /if \(linkedContract\.remuneration_type === 'recurring'\) \{[\s\S]*amount = 0;/i);
  assert.match(freightsServiceSource, /if \(!isPositiveNumber\(rawAmount\)\) throw (new (Error|AppError)\('Informe o valor do frete para contratos por viagem\.'\)|freightErrors\.perTripAmountRequired\(\));/i);
  assert.match(freightsServiceSource, /else if \(!isPositiveNumber\(rawAmount\)\) \{[\s\S]*(fretes avulsos|standaloneAmountRequired)/i);
});
