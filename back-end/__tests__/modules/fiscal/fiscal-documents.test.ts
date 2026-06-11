import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const migrationSource = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713412800000_fiscal_documents.sql'), 'utf8');
const novalogLinkMigrationSource = readFileSync(resolve(process.cwd(), 'back-end/migrations/1713416400000_fiscal_novalog_revenue_links.sql'), 'utf8');
const serviceSource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/services/fiscal-documents.service.ts'), 'utf8');
const repositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/fiscal/repositories/fiscal-documents.repository.ts'), 'utf8');

test('migration cria documentos fiscais como modulo generico multi-tenant', () => {
  assert.match(migrationSource, /create table if not exists fiscal_documents/i);
  assert.match(migrationSource, /tenant_id uuid not null references tenants\(id\) on delete cascade/i);
  assert.match(migrationSource, /document_type text not null default 'cte'/i);
  assert.match(migrationSource, /status text not null default 'draft'/i);
  assert.match(migrationSource, /xml text/i);
  assert.match(migrationSource, /tax_data jsonb not null default '\{\}'::jsonb/i);
  assert.match(migrationSource, /emitter_snapshot jsonb not null default '\{\}'::jsonb/i);
});

test('migration prepara partes eventos logs e vinculo futuro com fretes', () => {
  assert.match(migrationSource, /create table if not exists fiscal_document_parties/i);
  assert.match(migrationSource, /role in \('taker', 'sender', 'recipient', 'dispatcher', 'receiver'\)/i);
  assert.match(migrationSource, /create table if not exists fiscal_document_freights/i);
  assert.match(migrationSource, /freight_id uuid not null references freights\(id\) on delete cascade/i);
  assert.match(migrationSource, /create table if not exists fiscal_events/i);
  assert.match(migrationSource, /create table if not exists fiscal_communication_logs/i);
});

test('migration protege duplicidade por tenant e rastreia idempotencia', () => {
  assert.match(migrationSource, /idx_fiscal_documents_tenant_type_series_number/i);
  assert.match(migrationSource, /idx_fiscal_documents_tenant_access_key/i);
  assert.match(migrationSource, /idx_fiscal_documents_tenant_idempotency/i);
  assert.match(migrationSource, /trg_fiscal_documents_display_id/i);
});

test('service valida dados fiscais criticos antes de persistir', () => {
  assert.match(serviceSource, /const documentTypes: FiscalDocumentType\[\] = \['cte', 'cte_os', 'mdfe'\]/);
  assert.match(serviceSource, /const statuses: FiscalDocumentStatus\[\]/);
  assert.match(serviceSource, /\^\\d\{44\}\$/);
  assert.match(serviceSource, /isValidDate\(issueDate\)/);
  assert.match(serviceSource, /isPositiveNumber\(amount\)/);
  assert.match(serviceSource, /findFiscalDocumentDuplicate/);
  assert.match(serviceSource, /findFiscalDocumentByAccessKey/);
});

test('repository sempre filtra documentos fiscais por tenant', () => {
  assert.match(repositorySource, /from fiscal_documents\s+where tenant_id = \$1/i);
  assert.match(repositorySource, /where id = \$1\s+and tenant_id = \$2/i);
  assert.match(repositorySource, /delete from fiscal_documents[\s\S]*and tenant_id = \$2/i);
  assert.match(repositorySource, /from fiscal_document_parties[\s\S]*and tenant_id = \$2/i);
});

test('vinculo fiscal conecta CT-e Novalog e recebiveis sem duplicar documento', () => {
  assert.match(novalogLinkMigrationSource, /add column if not exists fiscal_document_id uuid references fiscal_documents\(id\) on delete set null/i);
  assert.match(novalogLinkMigrationSource, /idx_novalog_billing_items_fiscal_document_id/i);
  assert.match(novalogLinkMigrationSource, /idx_revenues_fiscal_document_id/i);
  assert.match(novalogLinkMigrationSource, /idx_novalog_billing_items_unique_fiscal_document/i);
  assert.match(repositorySource, /export async function upsertFiscalDocumentFromNovalogBillingItem/);
  assert.match(repositorySource, /on conflict \(tenant_id, document_type, series, number\) where status <> 'canceled' do update/i);
  assert.match(repositorySource, /normalizedAccessKey \? 'authorized' : 'draft'/);
});
