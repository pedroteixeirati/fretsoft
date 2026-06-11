import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaSource = readFileSync(resolve(process.cwd(), 'back-end/schema.sql'), 'utf8');
const novalogControllerSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/controllers/novalog.controller.ts'), 'utf8');
const novalogBillingServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/services/novalog-billings.service.ts'), 'utf8');
const novalogBillingRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/novalog/repositories/novalog-billings.repository.ts'), 'utf8');
const revenuesServiceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/revenues/services/revenues.service.ts'), 'utf8');
const revenuesRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/revenues/repositories/revenues.repository.ts'), 'utf8');

test('schema cria faturamentos Novalog e itens CT-e com rastreabilidade financeira por tenant', () => {
  assert.match(schemaSource, /create table if not exists novalog_billings \(/i);
  assert.match(schemaSource, /tenant_id uuid not null references tenants\(id\) on delete cascade/i);
  assert.match(schemaSource, /company_id uuid not null references companies\(id\) on delete restrict/i);
  assert.match(schemaSource, /status text not null default 'draft' check \(status in \('draft', 'open', 'partially_received', 'received', 'overdue', 'canceled'\)\)/i);
  assert.match(schemaSource, /create table if not exists novalog_billing_items \(/i);
  assert.match(schemaSource, /billing_id uuid not null references novalog_billings\(id\) on delete cascade/i);
  assert.match(schemaSource, /due_date text/i);
  assert.match(schemaSource, /linked_revenue_id uuid references revenues\(id\) on delete set null/i);
  assert.match(schemaSource, /fiscal_document_id uuid references fiscal_documents\(id\) on delete set null/i);
  assert.match(schemaSource, /create unique index if not exists idx_novalog_billing_items_tenant_cte_number/i);
});

test('schema permite revenues originadas de CT-e Novalog e vincula billing item a conta a receber', () => {
  assert.match(schemaSource, /novalog_billing_id uuid/i);
  assert.match(schemaSource, /novalog_billing_item_id uuid/i);
  assert.match(schemaSource, /source_type in \('contract', 'freight', 'manual', 'novalog_billing_item'\)/i);
  assert.match(schemaSource, /foreign key \(novalog_billing_id\) references novalog_billings\(id\) on delete set null/i);
  assert.match(schemaSource, /foreign key \(novalog_billing_item_id\) references novalog_billing_items\(id\) on delete set null/i);
  assert.match(schemaSource, /create unique index if not exists idx_revenues_novalog_billing_item_id/i);
});

test('controller expoe endpoints de faturamento Novalog com guardas de permissao', () => {
  assert.match(novalogControllerSource, /router\.get\('\/novalog\/billings'/);
  assert.match(novalogControllerSource, /router\.get\('\/novalog\/billings\/:id'/);
  assert.match(novalogControllerSource, /router\.post\('\/novalog\/billings'/);
  assert.match(novalogControllerSource, /router\.put\('\/novalog\/billings\/:id'/);
  assert.match(novalogControllerSource, /router\.post\('\/novalog\/billings\/:id\/close'/);
  assert.match(novalogControllerSource, /router\.post\('\/novalog\/billing-items\/:id\/receive'/);
  assert.match(novalogControllerSource, /router\.put\('\/novalog\/billing-items\/:id'/);
  assert.match(novalogControllerSource, /router\.delete\('\/novalog\/billing-items\/:id'/);
  assert.match(novalogControllerSource, /router\.post\('\/novalog\/billing-items\/:id\/overdue'/);
  assert.match(novalogControllerSource, /router\.post\('\/novalog\/billing-items\/:id\/cancel'/);
  assert.match(novalogControllerSource, /canPerform\('read', novalogBillingPermissions, req\.auth\?\.role\)/);
  assert.match(novalogControllerSource, /canPerform\('create', novalogBillingPermissions, req\.auth\?\.role\)/);
  assert.match(novalogControllerSource, /canPerform\('update', novalogBillingPermissions, req\.auth\?\.role\)/);
});

test('service bloqueia tenants fora da Novalog e valida dados essenciais do faturamento', () => {
  assert.match(novalogBillingServiceSource, /auth\.role !== 'dev' && auth\.tenantSlug !== 'novalog'/);
  assert.match(novalogBillingServiceSource, /isValidUuid\(companyId\)/);
  assert.match(novalogBillingServiceSource, /isValidDate\(billingDate\)/);
  assert.match(novalogBillingServiceSource, /isValidDate\(dueDate\)/);
  assert.match(novalogBillingServiceSource, /invalid_novalog_billing_cte_due_date/);
  assert.match(novalogBillingServiceSource, /items\.length === 0/);
  assert.match(novalogBillingServiceSource, /findCompanyForNovalogBilling\(companyId, auth\?\.tenantId \|\| ''\)/);
  assert.match(novalogBillingServiceSource, /duplicated_novalog_billing_cte/);
});

test('service deriva status do faturamento a partir dos CT-es individuais', () => {
  assert.match(novalogBillingServiceSource, /function deriveBillingStatus/);
  assert.match(novalogBillingServiceSource, /activeItems\.every\(\(item\) => item\.status === 'received'\).*return 'received'/s);
  assert.match(novalogBillingServiceSource, /activeItems\.some\(\(item\) => item\.status === 'overdue'\).*return 'overdue'/s);
  assert.match(novalogBillingServiceSource, /activeItems\.some\(\(item\) => item\.status === 'received' \|\| item\.status === 'partially_received'\).*return 'partially_received'/s);
  assert.match(novalogBillingServiceSource, /return 'open'/);
});

test('fechamento do faturamento gera uma revenue individual para cada CT-e', () => {
  assert.match(novalogBillingServiceSource, /export async function closeNovalogBilling/);
  assert.match(novalogBillingServiceSource, /for \(const item of items\) \{[\s\S]*await createRevenueForBillingItem\(billing, item, auth\?\.userId, client\);[\s\S]*\}/);
  assert.match(novalogBillingServiceSource, /insert into revenues \(/);
  assert.match(novalogBillingServiceSource, /const itemDueDate = item\.due_date \|\| billing\.due_date/);
  assert.match(novalogBillingServiceSource, /novalog_billing_id,\s*novalog_billing_item_id/i);
  assert.match(novalogBillingServiceSource, /fiscal_document_id/i);
  assert.match(novalogBillingServiceSource, /source_type,[\s\S]*'novalog_billing_item'/);
  assert.match(novalogBillingServiceSource, /on conflict \(novalog_billing_item_id\) where novalog_billing_item_id is not null do update/i);
  assert.match(novalogBillingServiceSource, /linkRevenueToNovalogBillingItem\(item\.id, billing\.tenant_id, revenueId, userId, client\)/);
});

test('CT-e Novalog cria ou reaproveita documento fiscal e propaga o vinculo para receitas', () => {
  assert.match(novalogBillingRepositorySource, /upsertFiscalDocumentFromNovalogBillingItem/);
  assert.match(novalogBillingRepositorySource, /ensureFiscalDocumentForNovalogItem/);
  assert.match(novalogBillingRepositorySource, /fiscal_document_id = coalesce\(\$9, fiscal_document_id\)/);
  assert.match(novalogBillingServiceSource, /fiscalDocumentId: row\.fiscal_document_id \|\| undefined/);
  assert.match(novalogBillingServiceSource, /fiscalDocumentId: item\.fiscal_document_id \|\| null/);
  assert.match(revenuesRepositorySource, /fiscal_document_id = \$5/);
});

test('baixa de CT-e exige faturamento fechado e sincroniza a revenue vinculada', () => {
  assert.match(novalogBillingServiceSource, /if \(billing\.status === 'draft'\) \{/);
  assert.match(novalogBillingServiceSource, /novalog_billing_not_closed/);
  assert.match(novalogBillingServiceSource, /updateTenantNovalogBillingItemStatus\(itemId, tenantId, status, auth\?\.userId\)/);
  assert.match(novalogBillingServiceSource, /updateNovalogBillingRevenueStatus\(updatedItem\.linked_revenue_id, tenantId, revenueStatus, auth\?\.userId\)/);
  assert.match(novalogBillingServiceSource, /refreshBillingStatus\(updatedItem\.billing_id, tenantId, auth\?\.userId\)/);
});

test('edicao e exclusao de CT-e bloqueiam recebidos e sincronizam recebiveis', () => {
  assert.match(novalogBillingServiceSource, /export async function updateNovalogBillingItem/);
  assert.match(novalogBillingServiceSource, /export async function deleteNovalogBillingItem/);
  assert.match(novalogBillingServiceSource, /item\.status === 'received' \|\| item\.status === 'partially_received'[\s\S]*novalog_billing_item_received_not_editable/);
  assert.match(novalogBillingServiceSource, /item\.status === 'received' \|\| item\.status === 'partially_received'[\s\S]*novalog_billing_item_received_not_deletable/);
  assert.match(novalogBillingServiceSource, /updateTenantNovalogBillingItem\(itemId, tenantId, payload,[\s\S]*billingDate: billing\.billing_date,[\s\S]*companyName: billing\.company_name,[\s\S]*auth\?\.userId, client\)/);
  assert.match(novalogBillingServiceSource, /syncRevenueFromBillingItem\(billing, updatedItem, auth\?\.userId, client\)/);
  assert.match(novalogBillingServiceSource, /countActiveTenantNovalogBillingItems\(item\.billing_id, tenantId, client\)/);
  assert.match(novalogBillingServiceSource, /updateTenantNovalogBillingItemStatus\(itemId, tenantId, 'canceled', auth\?\.userId, client\)/);
  assert.match(revenuesRepositorySource, /updateNovalogBillingRevenueFromItem/);
  assert.match(revenuesRepositorySource, /and status not in \('received', 'partially_received'\)/);
});

test('baixa no contas a receber sincroniza de volta o CT-e Novalog', () => {
  assert.match(revenuesServiceSource, /syncNovalogBillingItemFromRevenue/);
  assert.match(revenuesServiceSource, /source_type === 'novalog_billing_item'[\s\S]*syncNovalogBillingItemFromRevenue\(tenantId, revenueId, 'billed', actorUserId\)/);
  assert.match(revenuesServiceSource, /registerRevenuePayment\(revenueId, tenantId/);
  assert.match(revenuesServiceSource, /syncNovalogBillingItemFromRevenue\(tenantId, revenueId, nextStatus, actorUserId\)/);
  assert.match(revenuesServiceSource, /source_type === 'novalog_billing_item'[\s\S]*syncNovalogBillingItemFromRevenue\(tenantId, revenueId, 'overdue', actorUserId\)/);
  assert.match(novalogBillingRepositorySource, /updateNovalogBillingItemStatusByRevenue/);
});

test('repository lista faturamentos com totais agregados e persiste itens em transacao', () => {
  assert.match(novalogBillingRepositorySource, /count\(i\.id\) filter \(where i\.status <> 'canceled'\) as cte_count/);
  assert.match(novalogBillingRepositorySource, /sum\(i\.amount\) filter \(where i\.status <> 'canceled'\)/);
  assert.match(novalogBillingRepositorySource, /rp\.received_amount/);
  assert.match(novalogBillingRepositorySource, /max\(payment_date\) filter \(where status = 'active'\) as last_payment_at/);
  assert.match(novalogBillingServiceSource, /lastPaymentAt: row\.last_payment_at \|\| undefined/);
  assert.match(novalogBillingRepositorySource, /i\.status in \('pending', 'billed', 'partially_received'\)/);
  assert.match(novalogBillingRepositorySource, /and status <> 'canceled'/);
  assert.match(novalogBillingRepositorySource, /updateTenantNovalogBillingItem/);
  assert.match(novalogBillingRepositorySource, /countActiveTenantNovalogBillingItems/);
  assert.match(novalogBillingRepositorySource, /await client\.query\('begin'\)/);
  assert.match(novalogBillingRepositorySource, /await client\.query\('commit'\)/);
  assert.match(novalogBillingRepositorySource, /await client\.query\('rollback'\)/);
});

test('revenues mapeia origem CT-e Novalog para o front com vinculos de rastreabilidade', () => {
  assert.match(revenuesRepositorySource, /novalog_billing_id/);
  assert.match(revenuesRepositorySource, /novalog_billing_item_id/);
  assert.match(revenuesRepositorySource, /fiscal_document_id/);
  assert.match(revenuesRepositorySource, /source_type = 'novalog_billing_item'/);
  assert.match(readFileSync(resolve(process.cwd(), 'back-end/modules/revenues/dtos/revenue.types.ts'), 'utf8'), /novalogBillingId/);
  assert.match(readFileSync(resolve(process.cwd(), 'back-end/modules/revenues/dtos/revenue.types.ts'), 'utf8'), /fiscalDocumentId/);
});
