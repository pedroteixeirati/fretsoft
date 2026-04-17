-- Up Migration

create extension if not exists pgcrypto;

create table if not exists novalog_operation_entries (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  reference_month text not null,
  week_number integer not null,
  operation_date text not null,
  origin_name text not null,
  destination_name text not null,
  weight numeric not null default 0,
  company_rate_per_ton numeric not null default 0,
  company_gross_amount numeric not null default 0,
  aggregated_rate_per_ton numeric not null default 0,
  aggregated_gross_amount numeric not null default 0,
  ticket_number text,
  fuel_station_name text,
  driver_name text,
  vehicle_label text,
  driver_share_percent numeric not null default 40,
  driver_share_amount numeric not null default 0,
  driver_net_amount numeric not null default 0,
  notes text,
  entry_mode text not null default 'standard',
  batch_key text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists novalog_operation_entries add column if not exists display_id bigint;
alter table if exists novalog_operation_entries add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists novalog_operation_entries add column if not exists reference_month text;
alter table if exists novalog_operation_entries add column if not exists week_number integer;
alter table if exists novalog_operation_entries add column if not exists operation_date text;
alter table if exists novalog_operation_entries add column if not exists origin_name text;
alter table if exists novalog_operation_entries add column if not exists destination_name text;
alter table if exists novalog_operation_entries add column if not exists weight numeric not null default 0;
alter table if exists novalog_operation_entries add column if not exists company_rate_per_ton numeric not null default 0;
alter table if exists novalog_operation_entries add column if not exists company_gross_amount numeric not null default 0;
alter table if exists novalog_operation_entries add column if not exists aggregated_rate_per_ton numeric not null default 0;
alter table if exists novalog_operation_entries add column if not exists aggregated_gross_amount numeric not null default 0;
alter table if exists novalog_operation_entries add column if not exists ticket_number text;
alter table if exists novalog_operation_entries add column if not exists fuel_station_name text;
alter table if exists novalog_operation_entries add column if not exists driver_name text;
alter table if exists novalog_operation_entries add column if not exists vehicle_label text;
alter table if exists novalog_operation_entries add column if not exists driver_share_percent numeric not null default 40;
alter table if exists novalog_operation_entries add column if not exists driver_share_amount numeric not null default 0;
alter table if exists novalog_operation_entries add column if not exists driver_net_amount numeric not null default 0;
alter table if exists novalog_operation_entries add column if not exists notes text;
alter table if exists novalog_operation_entries add column if not exists entry_mode text not null default 'standard';
alter table if exists novalog_operation_entries add column if not exists batch_key text;
alter table if exists novalog_operation_entries add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table if exists novalog_operation_entries add column if not exists updated_by_user_id uuid references users(id) on delete set null;
alter table if exists novalog_operation_entries add column if not exists created_at timestamptz not null default now();
alter table if exists novalog_operation_entries add column if not exists updated_at timestamptz not null default now();

update novalog_operation_entries
set driver_share_percent = 40
where driver_share_percent is null;

update novalog_operation_entries
set company_rate_per_ton = 0
where company_rate_per_ton is null;

update novalog_operation_entries
set company_gross_amount = coalesce(company_gross_amount, 0)
where company_gross_amount is null;

update novalog_operation_entries
set aggregated_rate_per_ton = 0
where aggregated_rate_per_ton is null;

update novalog_operation_entries
set aggregated_gross_amount = coalesce(aggregated_gross_amount, 0)
where aggregated_gross_amount is null;

update novalog_operation_entries
set driver_share_amount = coalesce(driver_share_amount, 0)
where driver_share_amount is null;

update novalog_operation_entries
set driver_net_amount = coalesce(driver_net_amount, 0)
where driver_net_amount is null;

update novalog_operation_entries
set entry_mode = 'standard'
where entry_mode is null;

update novalog_operation_entries
set created_at = now()
where created_at is null;

update novalog_operation_entries
set updated_at = now()
where updated_at is null;

update novalog_operation_entries
set week_number = 4
where week_number > 4;

alter table if exists novalog_operation_entries
  alter column tenant_id set not null;

alter table if exists novalog_operation_entries
  alter column reference_month set not null;

alter table if exists novalog_operation_entries
  alter column week_number set not null;

alter table if exists novalog_operation_entries
  alter column operation_date set not null;

alter table if exists novalog_operation_entries
  alter column origin_name set not null;

alter table if exists novalog_operation_entries
  alter column destination_name set not null;

alter table if exists novalog_operation_entries
  alter column created_at set not null;

alter table if exists novalog_operation_entries
  alter column updated_at set not null;

alter table if exists novalog_operation_entries
  drop constraint if exists novalog_operation_entries_entry_mode_check;

alter table if exists novalog_operation_entries
  add constraint novalog_operation_entries_entry_mode_check
  check (entry_mode in ('standard', 'batch'));

alter table if exists novalog_operation_entries
  drop constraint if exists novalog_operation_entries_week_number_check;

alter table if exists novalog_operation_entries
  add constraint novalog_operation_entries_week_number_check
  check (week_number between 1 and 4);

alter table if exists novalog_operation_entries drop column if exists code;

create or replace function assign_tenant_display_id()
returns trigger
language plpgsql
as $$
declare
  next_display_id bigint;
begin
  if new.display_id is not null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext(tg_table_name || ':' || coalesce(new.tenant_id::text, 'global')));

  execute format('select coalesce(max(display_id), 0) + 1 from %I where tenant_id = $1', tg_table_name)
    into next_display_id
    using new.tenant_id;

  new.display_id := next_display_id;
  return new;
end;
$$;

with numbered as (
  select
    id,
    row_number() over (partition by tenant_id order by created_at asc, id asc) as next_display_id
  from novalog_operation_entries
  where display_id is null
)
update novalog_operation_entries entry
set display_id = numbered.next_display_id
from numbered
where entry.id = numbered.id;

drop trigger if exists trg_novalog_operation_entries_display_id on novalog_operation_entries;

create trigger trg_novalog_operation_entries_display_id
before insert on novalog_operation_entries
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_novalog_entries_tenant_display_id
  on novalog_operation_entries(tenant_id, display_id)
  where display_id is not null;

create index if not exists idx_novalog_entries_tenant_id
  on novalog_operation_entries(tenant_id);

create index if not exists idx_novalog_entries_reference_month
  on novalog_operation_entries(tenant_id, reference_month, week_number);

create index if not exists idx_novalog_entries_origin_destination
  on novalog_operation_entries(tenant_id, origin_name, destination_name);

-- Down Migration
