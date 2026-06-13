-- Up Migration

create extension if not exists pgcrypto;

create table if not exists recurring_payables (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  description text not null,
  provider_name text,
  amount numeric(12, 2) not null default 0,
  due_day integer not null default 1,
  starts_on date,
  ends_on date,
  status text not null default 'active',
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists recurring_payables drop constraint if exists recurring_payables_due_day_check;
alter table if exists recurring_payables
  add constraint recurring_payables_due_day_check
  check (due_day between 1 and 31);

alter table if exists recurring_payables drop constraint if exists recurring_payables_status_check;
alter table if exists recurring_payables
  add constraint recurring_payables_status_check
  check (status in ('active', 'paused'));

drop trigger if exists trg_recurring_payables_display_id on recurring_payables;
create trigger trg_recurring_payables_display_id
before insert on recurring_payables
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_recurring_payables_tenant_display_id
  on recurring_payables(tenant_id, display_id)
  where display_id is not null;

create index if not exists idx_recurring_payables_tenant_id
  on recurring_payables(tenant_id);

create index if not exists idx_recurring_payables_tenant_status
  on recurring_payables(tenant_id, status);

alter table if exists payables add column if not exists recurring_payable_id uuid references recurring_payables(id) on delete set null;

create index if not exists idx_payables_recurring_payable
  on payables(tenant_id, recurring_payable_id);

create unique index if not exists idx_payables_recurring_reference_month
  on payables(tenant_id, recurring_payable_id, reference_month)
  where recurring_payable_id is not null and reference_month is not null;

-- Down Migration

drop index if exists idx_payables_recurring_reference_month;
drop index if exists idx_payables_recurring_payable;
alter table if exists payables drop column if exists recurring_payable_id;
drop index if exists idx_recurring_payables_tenant_status;
drop index if exists idx_recurring_payables_tenant_id;
drop index if exists idx_recurring_payables_tenant_display_id;
drop trigger if exists trg_recurring_payables_display_id on recurring_payables;
drop table if exists recurring_payables;
