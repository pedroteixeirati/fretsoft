-- Up Migration

create extension if not exists pgcrypto;

create table if not exists cargo_insurance_policies (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  insurance_company_name text not null,
  insurance_company_document text not null,
  policy_number text not null,
  responsible_type text not null default 'carrier',
  coverage_type text not null default 'rctr_c',
  starts_at date,
  ends_at date,
  status text not null default 'active',
  is_default boolean not null default false,
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists cargo_insurance_policies add column if not exists display_id bigint;
alter table if exists cargo_insurance_policies add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists cargo_insurance_policies add column if not exists insurance_company_name text;
alter table if exists cargo_insurance_policies add column if not exists insurance_company_document text;
alter table if exists cargo_insurance_policies add column if not exists policy_number text;
alter table if exists cargo_insurance_policies add column if not exists responsible_type text default 'carrier';
alter table if exists cargo_insurance_policies add column if not exists coverage_type text default 'rctr_c';
alter table if exists cargo_insurance_policies add column if not exists starts_at date;
alter table if exists cargo_insurance_policies add column if not exists ends_at date;
alter table if exists cargo_insurance_policies add column if not exists status text default 'active';
alter table if exists cargo_insurance_policies add column if not exists is_default boolean default false;
alter table if exists cargo_insurance_policies add column if not exists notes text;
alter table if exists cargo_insurance_policies add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table if exists cargo_insurance_policies add column if not exists updated_by_user_id uuid references users(id) on delete set null;
alter table if exists cargo_insurance_policies add column if not exists created_at timestamptz default now();
alter table if exists cargo_insurance_policies add column if not exists updated_at timestamptz default now();

update cargo_insurance_policies set responsible_type = 'carrier' where responsible_type is null;
update cargo_insurance_policies set coverage_type = 'rctr_c' where coverage_type is null;
update cargo_insurance_policies set status = 'active' where status is null;
update cargo_insurance_policies set is_default = false where is_default is null;
update cargo_insurance_policies set created_at = now() where created_at is null;
update cargo_insurance_policies set updated_at = now() where updated_at is null;

alter table if exists cargo_insurance_policies alter column tenant_id set not null;
alter table if exists cargo_insurance_policies alter column insurance_company_name set not null;
alter table if exists cargo_insurance_policies alter column insurance_company_document set not null;
alter table if exists cargo_insurance_policies alter column policy_number set not null;
alter table if exists cargo_insurance_policies alter column responsible_type set not null;
alter table if exists cargo_insurance_policies alter column coverage_type set not null;
alter table if exists cargo_insurance_policies alter column status set not null;
alter table if exists cargo_insurance_policies alter column is_default set not null;
alter table if exists cargo_insurance_policies alter column created_at set not null;
alter table if exists cargo_insurance_policies alter column updated_at set not null;

alter table if exists cargo_insurance_policies drop constraint if exists cargo_insurance_policies_responsible_type_check;
alter table if exists cargo_insurance_policies
  add constraint cargo_insurance_policies_responsible_type_check
  check (responsible_type in ('carrier', 'shipper', 'taker', 'other'));

alter table if exists cargo_insurance_policies drop constraint if exists cargo_insurance_policies_coverage_type_check;
alter table if exists cargo_insurance_policies
  add constraint cargo_insurance_policies_coverage_type_check
  check (coverage_type in ('rctr_c', 'rcf_dc', 'other'));

alter table if exists cargo_insurance_policies drop constraint if exists cargo_insurance_policies_status_check;
alter table if exists cargo_insurance_policies
  add constraint cargo_insurance_policies_status_check
  check (status in ('active', 'inactive', 'expired'));

with numbered as (
  select id, row_number() over (partition by tenant_id order by created_at asc, id asc) as next_display_id
  from cargo_insurance_policies
  where display_id is null
)
update cargo_insurance_policies policy
set display_id = numbered.next_display_id
from numbered
where policy.id = numbered.id;

drop trigger if exists trg_cargo_insurance_policies_display_id on cargo_insurance_policies;
create trigger trg_cargo_insurance_policies_display_id
before insert on cargo_insurance_policies
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_cargo_insurance_policies_tenant_display_id
  on cargo_insurance_policies(tenant_id, display_id)
  where display_id is not null;

create index if not exists idx_cargo_insurance_policies_tenant_id
  on cargo_insurance_policies(tenant_id);

create index if not exists idx_cargo_insurance_policies_status
  on cargo_insurance_policies(tenant_id, status);

create unique index if not exists idx_cargo_insurance_policies_tenant_default
  on cargo_insurance_policies(tenant_id)
  where is_default = true and status = 'active';

-- Down Migration

drop index if exists idx_cargo_insurance_policies_tenant_default;
drop index if exists idx_cargo_insurance_policies_status;
drop index if exists idx_cargo_insurance_policies_tenant_id;
drop index if exists idx_cargo_insurance_policies_tenant_display_id;
drop trigger if exists trg_cargo_insurance_policies_display_id on cargo_insurance_policies;
drop table if exists cargo_insurance_policies;
