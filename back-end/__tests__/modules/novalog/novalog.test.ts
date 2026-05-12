import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const novalogControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/controllers/novalog.controller.ts'), 'utf8');
const novalogRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/repositories/novalog.repository.ts'), 'utf8');
const novalogServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/services/novalog.service.ts'), 'utf8');
const novalogBillingsRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/repositories/novalog-billings.repository.ts'), 'utf8');
const novalogBillingsServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/services/novalog-billings.service.ts'), 'utf8');

test('repositorio Novalog lista e persiste registros explicitamente por tenant', () => {
  assert.match(novalogRepositorySource, /from novalog_operation_entries/i);
  assert.match(novalogRepositorySource, /whereClauses = \['tenant_id = \$1'\]/);
  assert.match(novalogRepositorySource, /reference_month = \$\$\{values\.length\}/);
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
