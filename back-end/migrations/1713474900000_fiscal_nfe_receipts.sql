-- Up Migration

create extension if not exists pgcrypto;

create table if not exists fiscal_nfe_receipts (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  source text not null default 'upload',
  status text not null default 'pending',
  nfe_key text not null,
  xml text not null,
  sender_snapshot jsonb not null default '{}'::jsonb,
  recipient_snapshot jsonb not null default '{}'::jsonb,
  totals_snapshot jsonb not null default '{}'::jsonb,
  product_snapshot jsonb not null default '{}'::jsonb,
  issue_date text,
  used_fiscal_document_id uuid references fiscal_documents(id) on delete set null,
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists fiscal_nfe_receipts add column if not exists display_id bigint;
alter table if exists fiscal_nfe_receipts add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists fiscal_nfe_receipts add column if not exists source text default 'upload';
alter table if exists fiscal_nfe_receipts add column if not exists status text default 'pending';
alter table if exists fiscal_nfe_receipts add column if not exists nfe_key text;
alter table if exists fiscal_nfe_receipts add column if not exists xml text;
alter table if exists fiscal_nfe_receipts add column if not exists sender_snapshot jsonb default '{}'::jsonb;
alter table if exists fiscal_nfe_receipts add column if not exists recipient_snapshot jsonb default '{}'::jsonb;
alter table if exists fiscal_nfe_receipts add column if not exists totals_snapshot jsonb default '{}'::jsonb;
alter table if exists fiscal_nfe_receipts add column if not exists product_snapshot jsonb default '{}'::jsonb;
alter table if exists fiscal_nfe_receipts add column if not exists issue_date text;
alter table if exists fiscal_nfe_receipts add column if not exists used_fiscal_document_id uuid references fiscal_documents(id) on delete set null;
alter table if exists fiscal_nfe_receipts add column if not exists notes text;
alter table if exists fiscal_nfe_receipts add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table if exists fiscal_nfe_receipts add column if not exists updated_by_user_id uuid references users(id) on delete set null;
alter table if exists fiscal_nfe_receipts add column if not exists created_at timestamptz default now();
alter table if exists fiscal_nfe_receipts add column if not exists updated_at timestamptz default now();

update fiscal_nfe_receipts set source = 'upload' where source is null;
update fiscal_nfe_receipts set status = 'pending' where status is null;
update fiscal_nfe_receipts set sender_snapshot = '{}'::jsonb where sender_snapshot is null;
update fiscal_nfe_receipts set recipient_snapshot = '{}'::jsonb where recipient_snapshot is null;
update fiscal_nfe_receipts set totals_snapshot = '{}'::jsonb where totals_snapshot is null;
update fiscal_nfe_receipts set product_snapshot = '{}'::jsonb where product_snapshot is null;
update fiscal_nfe_receipts set created_at = now() where created_at is null;
update fiscal_nfe_receipts set updated_at = now() where updated_at is null;

alter table if exists fiscal_nfe_receipts alter column tenant_id set not null;
alter table if exists fiscal_nfe_receipts alter column source set not null;
alter table if exists fiscal_nfe_receipts alter column status set not null;
alter table if exists fiscal_nfe_receipts alter column nfe_key set not null;
alter table if exists fiscal_nfe_receipts alter column xml set not null;
alter table if exists fiscal_nfe_receipts alter column sender_snapshot set not null;
alter table if exists fiscal_nfe_receipts alter column recipient_snapshot set not null;
alter table if exists fiscal_nfe_receipts alter column totals_snapshot set not null;
alter table if exists fiscal_nfe_receipts alter column product_snapshot set not null;
alter table if exists fiscal_nfe_receipts alter column created_at set not null;
alter table if exists fiscal_nfe_receipts alter column updated_at set not null;

alter table if exists fiscal_nfe_receipts drop constraint if exists fiscal_nfe_receipts_source_check;
alter table if exists fiscal_nfe_receipts
  add constraint fiscal_nfe_receipts_source_check
  check (source in ('upload', 'email', 'api', 'focus'));

alter table if exists fiscal_nfe_receipts drop constraint if exists fiscal_nfe_receipts_status_check;
alter table if exists fiscal_nfe_receipts
  add constraint fiscal_nfe_receipts_status_check
  check (status in ('pending', 'validated', 'used', 'ignored', 'error'));

drop trigger if exists trg_fiscal_nfe_receipts_display_id on fiscal_nfe_receipts;
create trigger trg_fiscal_nfe_receipts_display_id
before insert on fiscal_nfe_receipts
for each row execute function assign_tenant_display_id();

create unique index if not exists idx_fiscal_nfe_receipts_tenant_display_id
  on fiscal_nfe_receipts(tenant_id, display_id)
  where display_id is not null;

create unique index if not exists idx_fiscal_nfe_receipts_tenant_nfe_key
  on fiscal_nfe_receipts(tenant_id, nfe_key);

create index if not exists idx_fiscal_nfe_receipts_tenant_status
  on fiscal_nfe_receipts(tenant_id, status, created_at desc);

-- Down Migration

drop index if exists idx_fiscal_nfe_receipts_tenant_status;
drop index if exists idx_fiscal_nfe_receipts_tenant_nfe_key;
drop index if exists idx_fiscal_nfe_receipts_tenant_display_id;
drop trigger if exists trg_fiscal_nfe_receipts_display_id on fiscal_nfe_receipts;
drop table if exists fiscal_nfe_receipts;
