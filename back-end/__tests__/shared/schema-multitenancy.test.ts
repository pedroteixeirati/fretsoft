import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schema = readFileSync(resolve(process.cwd(), 'back-end/schema.sql'), 'utf8');
const resourcesRepositorySource = readFileSync(resolve(process.cwd(), 'back-end/modules/resources/repositories/resources.repository.ts'), 'utf8');

test('tabelas centrais possuem tenant_id no schema', () => {
  for (const table of ['vehicles', 'providers', 'companies', 'contracts', 'freights', 'expenses', 'revenues']) {
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
  for (const table of ['vehicles', 'providers', 'companies', 'contracts', 'freights', 'expenses', 'revenues']) {
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
  for (const table of ['tenants', 'users', 'tenant_users', 'vehicles', 'providers', 'companies', 'contracts', 'freights', 'expenses', 'revenues']) {
    assert.match(
      schema,
      new RegExp(`create table if not exists ${table} \\([\\s\\S]*id uuid primary key default gen_random_uuid\\(\\),[\\s\\S]*display_id bigint`, 'i')
    );
  }

  assert.match(schema, /create or replace function assign_global_display_id/i);
  assert.match(schema, /create or replace function assign_tenant_display_id/i);
  assert.match(schema, /create unique index if not exists idx_vehicles_tenant_display_id/i);
  assert.match(schema, /create unique index if not exists idx_revenues_tenant_display_id/i);
});

test('schema permite vincular fretes a contratos com tipo de faturamento explicito', () => {
  assert.match(schema, /create table if not exists freights \([\s\S]*contract_id uuid references contracts\(id\) on delete set null,/i);
  assert.match(schema, /create table if not exists freights \([\s\S]*contract_name text,/i);
  assert.match(schema, /create table if not exists freights \([\s\S]*billing_type text not null default 'standalone' check \(billing_type in \('standalone', 'contract_recurring', 'contract_per_trip'\)\)/i);
});
