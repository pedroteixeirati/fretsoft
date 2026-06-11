-- Up Migration

create extension if not exists pgcrypto;

alter table if exists fiscal_documents add column if not exists execution_mode text not null default 'own_fleet';
alter table if exists fiscal_documents add column if not exists ciot text;
alter table if exists fiscal_documents add column if not exists rntrc text;

update fiscal_documents set execution_mode = 'own_fleet' where execution_mode is null;

alter table if exists fiscal_documents drop constraint if exists fiscal_documents_execution_mode_check;
alter table if exists fiscal_documents
  add constraint fiscal_documents_execution_mode_check
  check (execution_mode in ('own_fleet', 'third_party'));

create table if not exists fiscal_document_payments (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  fiscal_document_id uuid not null references fiscal_documents(id) on delete cascade,
  payee_document text,
  payee_name text,
  component_type text not null default '04',
  amount numeric not null default 0,
  bank_name text,
  bank_branch text,
  bank_account text,
  pix_key text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists fiscal_document_payments add column if not exists display_id bigint;
alter table if exists fiscal_document_payments add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists fiscal_document_payments add column if not exists fiscal_document_id uuid references fiscal_documents(id) on delete cascade;
alter table if exists fiscal_document_payments add column if not exists payee_document text;
alter table if exists fiscal_document_payments add column if not exists payee_name text;
alter table if exists fiscal_document_payments add column if not exists component_type text default '04';
alter table if exists fiscal_document_payments add column if not exists amount numeric default 0;
alter table if exists fiscal_document_payments add column if not exists bank_name text;
alter table if exists fiscal_document_payments add column if not exists bank_branch text;
alter table if exists fiscal_document_payments add column if not exists bank_account text;
alter table if exists fiscal_document_payments add column if not exists pix_key text;
alter table if exists fiscal_document_payments add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table if exists fiscal_document_payments add column if not exists updated_by_user_id uuid references users(id) on delete set null;
alter table if exists fiscal_document_payments add column if not exists created_at timestamptz default now();
alter table if exists fiscal_document_payments add column if not exists updated_at timestamptz default now();

update fiscal_document_payments set component_type = '04' where component_type is null;
update fiscal_document_payments set amount = 0 where amount is null;
update fiscal_document_payments set created_at = now() where created_at is null;
update fiscal_document_payments set updated_at = now() where updated_at is null;

alter table if exists fiscal_document_payments alter column tenant_id set not null;
alter table if exists fiscal_document_payments alter column fiscal_document_id set not null;
alter table if exists fiscal_document_payments alter column component_type set not null;
alter table if exists fiscal_document_payments alter column amount set not null;
alter table if exists fiscal_document_payments alter column created_at set not null;
alter table if exists fiscal_document_payments alter column updated_at set not null;

alter table if exists fiscal_document_payments drop constraint if exists fiscal_document_payments_component_check;
alter table if exists fiscal_document_payments
  add constraint fiscal_document_payments_component_check
  check (component_type in ('01', '02', '03', '04'));

drop trigger if exists trg_fiscal_document_payments_display_id on fiscal_document_payments;
create trigger trg_fiscal_document_payments_display_id
before insert on fiscal_document_payments
for each row
execute function assign_tenant_display_id();

create index if not exists idx_fiscal_document_payments_document
  on fiscal_document_payments(tenant_id, fiscal_document_id);

-- Down Migration

drop index if exists idx_fiscal_document_payments_document;
drop trigger if exists trg_fiscal_document_payments_display_id on fiscal_document_payments;
drop table if exists fiscal_document_payments;

alter table if exists fiscal_documents drop constraint if exists fiscal_documents_execution_mode_check;
alter table if exists fiscal_documents drop column if exists rntrc;
alter table if exists fiscal_documents drop column if exists ciot;
alter table if exists fiscal_documents drop column if exists execution_mode;
