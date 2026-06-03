import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schema = readFileSync(resolve(process.cwd(), 'back-end/schema.sql'), 'utf8');
const resourcesRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/resources/repositories/resources.repository.ts'), 'utf8');

test('tabelas centrais possuem tenant_id no schema', () => {
  for (const table of ['vehicles', 'providers', 'companies', 'contracts', 'freights', 'cargas', 'expenses', 'revenues', 'payables']) {
    assert.match(
      schema,
      new RegExp(`create table if not exists ${table} \\([\\s\\S]*tenant_id uuid not null references tenants`, 'i')
    );
  }
});

test('schema protege unicidade critica de placa e CNPJ por tenant', () => {
  assert.match(schema, /create unique index if not exists idx_vehicles_tenant_plate/i);
  assert.match(schema, /create unique index if not exists idx_companies_tenant_cnpj/i);
});

test('schema registra auditoria nos recursos sensiveis', () => {
  for (const table of ['vehicles', 'providers', 'companies', 'contracts', 'freights', 'cargas', 'expenses', 'revenues', 'payables']) {
    assert.match(
      schema,
      new RegExp(`create table if not exists ${table} \\([\\s\\S]*created_by_user_id uuid references users\\(id\\) on delete set null,[\\s\\S]*updated_by_user_id uuid references users\\(id\\) on delete set null`, 'i')
    );
  }
});

test('crud generico nao tenta inserir colunas ausentes no schema', () => {
  assert.doesNotMatch(resourcesRepositorySource, /const columns = \['owner_uid'/i);
  assert.match(resourcesRepositorySource, /const columns = \['tenant_id', 'created_by_user_id', 'updated_by_user_id'/i);
});

test('schema remove coluna legada owner_uid dos recursos operacionais', () => {
  for (const table of ['vehicles', 'providers', 'companies', 'contracts', 'freights', 'expenses']) {
    assert.match(
      schema,
      new RegExp(`alter table if exists ${table} drop column if exists owner_uid;`, 'i')
    );
  }
});

test('schema cria numero amigavel para entidades centrais sem substituir o uuid tecnico', () => {
  for (const table of ['tenants', 'users', 'tenant_users', 'vehicles', 'providers', 'companies', 'contracts', 'freights', 'cargas', 'expenses', 'revenues', 'payables']) {
    assert.match(
      schema,
      new RegExp(`create table if not exists ${table} \\([\\s\\S]*id uuid primary key default gen_random_uuid\\(\\),[\\s\\S]*display_id bigint`, 'i')
    );
  }

  assert.match(schema, /create or replace function assign_global_display_id/i);
  assert.match(schema, /create or replace function assign_tenant_display_id/i);
  assert.match(schema, /create unique index if not exists idx_vehicles_tenant_display_id/i);
  assert.match(schema, /create unique index if not exists idx_revenues_tenant_display_id/i);
  assert.match(schema, /create unique index if not exists idx_payables_tenant_display_id/i);
});

test('schema permite vincular fretes a contratos com tipo de faturamento explicito', () => {
  assert.match(schema, /create table if not exists freights \([\s\S]*contract_id uuid references contracts\(id\) on delete set null,/i);
  assert.match(schema, /create table if not exists freights \([\s\S]*contract_name text,/i);
  assert.match(schema, /create table if not exists freights \([\s\S]*billing_type text not null default 'standalone' check \(billing_type in \('standalone', 'contract_recurring', 'contract_per_trip'\)\)/i);
  assert.match(schema, /create table if not exists freights \([\s\S]*has_carga boolean not null default true/i);
});

test('schema cria cargas vinculadas a fretes e clientes dentro do tenant', () => {
  assert.match(schema, /create table if not exists cargas \([\s\S]*freight_id uuid not null references freights\(id\) on delete cascade,/i);
  assert.match(schema, /create table if not exists cargas \([\s\S]*company_id uuid not null references companies\(id\) on delete restrict,/i);
  assert.match(schema, /create table if not exists cargas \([\s\S]*status text not null default 'planned' check \(status in \('planned', 'loading', 'in_transit', 'delivered', 'cancelled'\)\)/i);
  assert.match(schema, /create unique index if not exists idx_cargas_tenant_display_id/i);
  assert.match(schema, /create index if not exists idx_cargas_freight_id on cargas\(tenant_id, freight_id\)/i);
});

test('schema cria payables com origem financeira rastreavel e vinculo com custos operacionais', () => {
  assert.match(schema, /create table if not exists payables \([\s\S]*source_type text not null default 'manual' check \(source_type in \('expense', 'manual'\)\)/i);
  assert.match(schema, /create table if not exists payables \([\s\S]*source_id uuid,/i);
  assert.match(schema, /create table if not exists payables \([\s\S]*due_date text not null,/i);
  assert.match(schema, /create table if not exists payables \([\s\S]*status text not null default 'open' check \(status in \('open', 'paid', 'overdue', 'canceled'\)\)/i);
  assert.match(schema, /alter table if exists expenses[\s\S]*add constraint expenses_linked_payable_id_fkey[\s\S]*foreign key \(linked_payable_id\) references payables\(id\) on delete set null/i);
  assert.match(schema, /create index if not exists idx_payables_tenant_status on payables\(tenant_id, status\)/i);
  assert.match(schema, /create index if not exists idx_payables_tenant_due_date on payables\(tenant_id, due_date\)/i);
});

test('schema diferencia finalidade de fornecedores para fluxos operacionais e financeiros', () => {
  assert.match(schema, /create table if not exists providers \([\s\S]*usage_type text not null default 'operational' check \(usage_type in \('operational', 'financial', 'both'\)\)/i);
  assert.match(schema, /alter table if exists providers add column if not exists usage_type text not null default 'operational';/i);
  assert.match(schema, /create index if not exists idx_providers_tenant_usage_type on providers\(tenant_id, usage_type\)/i);
});

test('schema guarda metadados da planilha Novalog em contas a pagar sem criar modulo paralelo', () => {
  assert.match(schema, /create table if not exists payables \([\s\S]*document_number text,/i);
  assert.match(schema, /create table if not exists payables \([\s\S]*invoice_number text,/i);
  assert.match(schema, /create table if not exists payables \([\s\S]*invoice_status text not null default 'not_informed' check \(invoice_status in \('informed', 'missing', 'not_informed'\)\)/i);
  assert.match(schema, /create table if not exists payables \([\s\S]*reference_month text,/i);
  assert.match(schema, /create table if not exists payables \([\s\S]*import_sheet_name text,/i);
  assert.match(schema, /create table if not exists payables \([\s\S]*import_row_number integer,/i);
  assert.match(schema, /create index if not exists idx_payables_tenant_reference_month on payables\(tenant_id, reference_month\)/i);
});
