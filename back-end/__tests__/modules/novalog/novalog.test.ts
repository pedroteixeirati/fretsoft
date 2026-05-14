import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const novalogControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/controllers/novalog.controller.ts'), 'utf8');
const novalogRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/repositories/novalog.repository.ts'), 'utf8');
const novalogServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/services/novalog.service.ts'), 'utf8');
const novalogBillingsRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/repositories/novalog-billings.repository.ts'), 'utf8');
const novalogBillingsServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/services/novalog-billings.service.ts'), 'utf8');
const novalogReportsExportServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/services/novalog-reports-export.service.ts'), 'utf8');

test('repositorio Novalog lista e persiste registros explicitamente por tenant', () => {
  assert.match(novalogRepositorySource, /from novalog_operation_entries/i);
  assert.match(novalogRepositorySource, /left join users created_by_user on created_by_user\.id = e\.created_by_user_id/i);
  assert.match(novalogRepositorySource, /coalesce\(created_by_user\.name, ''\) as created_by_name/i);
  assert.match(novalogRepositorySource, /whereClauses = \['e\.tenant_id = \$1'\]/);
  assert.match(novalogRepositorySource, /e\.reference_month = \$\$\{values\.length\}/);
  assert.match(novalogRepositorySource, /order by e\.created_at desc, e\.id desc/i);
  assert.match(novalogServiceSource, /createdByName: row\.created_by_name \|\| ''/);
  assert.match(novalogRepositorySource, /insert into novalog_operation_entries/i);
  assert.match(novalogRepositorySource, /update novalog_operation_entries/i);
  assert.match(novalogRepositorySource, /delete from novalog_operation_entries/i);
  assert.match(novalogRepositorySource, /await client\.query\('begin'\)/);
  assert.match(novalogRepositorySource, /await client\.query\('commit'\)/);
});

test('relatorio Novalog expoe pagamentos reais ligados aos recebiveis de CT-e', () => {
  assert.match(novalogControllerSource, /router\.get\('\/novalog\/reports\/payments'/);
  assert.match(novalogBillingsServiceSource, /export async function listNovalogReportPayments\(auth\?: AuthContext\)/);
  assert.match(novalogBillingsRepositorySource, /from revenue_payments rp/i);
  assert.match(novalogBillingsRepositorySource, /r\.source_type = 'novalog_billing_item'/);
  assert.match(novalogBillingsRepositorySource, /i\.cte_number/);
});

test('relatorio Novalog exporta planilha xlsx com aba atual e relatorio completo', () => {
  assert.match(novalogControllerSource, /router\.get\('\/novalog\/reports\/export'/);
  assert.match(novalogControllerSource, /application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet/);
  assert.match(novalogReportsExportServiceSource, /export async function exportNovalogReportWorkbook/);
  assert.match(novalogReportsExportServiceSource, /workbook\.addWorksheet\('Resumo'\)/);
  assert.match(novalogReportsExportServiceSource, /workbook\.addWorksheet\('Saldo por Cliente'\)/);
  assert.match(novalogReportsExportServiceSource, /workbook\.addWorksheet\('Recebimentos'\)/);
  assert.match(novalogReportsExportServiceSource, /workbook\.addWorksheet\('Faturamentos'\)/);
  assert.match(novalogReportsExportServiceSource, /workbook\.addWorksheet\('Operacao'\)/);
  assert.match(novalogReportsExportServiceSource, /auth\.tenantLogoUrl/);
});

test('controller e service Novalog expoem CRUD e lote sem depender de resources', () => {
  assert.match(novalogServiceSource, /export const novalogPermissions: ResourcePermissions = \{/);
  assert.match(novalogServiceSource, /export async function listNovalogEntries\(auth\?: AuthContext, filters: NovalogEntriesFilters = \{\}\)/);
  assert.match(novalogServiceSource, /export async function listNovalogReferenceMonths\(auth\?: AuthContext\)/);
  assert.match(novalogServiceSource, /export async function createNovalogEntry\(auth: AuthContext \| undefined, body: NovalogEntryInput\)/);
  assert.match(novalogServiceSource, /export async function createNovalogBatch\(auth: AuthContext \| undefined, body: NovalogBatchInput\)/);
  assert.match(novalogServiceSource, /export async function updateNovalogEntry\(auth: AuthContext \| undefined, id: string, body: NovalogEntryInput\)/);
  assert.match(novalogServiceSource, /export async function deleteNovalogEntry\(auth: AuthContext \| undefined, id: string\)/);
  assert.match(novalogServiceSource, /auth\.role !== 'dev' && auth\.tenantSlug !== 'novalog'/);
  assert.match(novalogControllerSource, /router\.get\('\/novalog\/entries'/);
  assert.match(novalogControllerSource, /router\.get\('\/novalog\/entries\/reference-months'/);
  assert.match(novalogControllerSource, /router\.post\('\/novalog\/entries'/);
  assert.match(novalogControllerSource, /router\.post\('\/novalog\/entries\/batch'/);
  assert.match(novalogControllerSource, /router\.put\('\/novalog\/entries\/:id'/);
  assert.match(novalogControllerSource, /router\.delete\('\/novalog\/entries\/:id'/);
  assert.doesNotMatch(novalogControllerSource, /createResource|listResources|updateResource|removeResource/);
});
