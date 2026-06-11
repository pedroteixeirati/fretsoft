-- Up Migration

create extension if not exists pgcrypto;

create table if not exists transport_partners (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  document_number text not null,
  partner_type text not null default 'tac',
  rntrc text,
  bank_name text,
  bank_branch text,
  bank_account text,
  bank_account_type text,
  pix_key text,
  pix_key_type text,
  status text not null default 'active',
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists transport_partners add column if not exists display_id bigint;
alter table if exists transport_partners add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists transport_partners add column if not exists name text;
alter table if exists transport_partners add column if not exists document_number text;
alter table if exists transport_partners add column if not exists partner_type text default 'tac';
alter table if exists transport_partners add column if not exists rntrc text;
alter table if exists transport_partners add column if not exists bank_name text;
alter table if exists transport_partners add column if not exists bank_branch text;
alter table if exists transport_partners add column if not exists bank_account text;
alter table if exists transport_partners add column if not exists bank_account_type text;
alter table if exists transport_partners add column if not exists pix_key text;
alter table if exists transport_partners add column if not exists pix_key_type text;
alter table if exists transport_partners add column if not exists status text default 'active';
alter table if exists transport_partners add column if not exists notes text;
alter table if exists transport_partners add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table if exists transport_partners add column if not exists updated_by_user_id uuid references users(id) on delete set null;
alter table if exists transport_partners add column if not exists created_at timestamptz default now();
alter table if exists transport_partners add column if not exists updated_at timestamptz default now();

update transport_partners set partner_type = 'tac' where partner_type is null;
update transport_partners set status = 'active' where status is null;
update transport_partners set created_at = now() where created_at is null;
update transport_partners set updated_at = now() where updated_at is null;

alter table if exists transport_partners alter column tenant_id set not null;
alter table if exists transport_partners alter column name set not null;
alter table if exists transport_partners alter column document_number set not null;
alter table if exists transport_partners alter column partner_type set not null;
alter table if exists transport_partners alter column status set not null;
alter table if exists transport_partners alter column created_at set not null;
alter table if exists transport_partners alter column updated_at set not null;

alter table if exists transport_partners drop constraint if exists transport_partners_type_check;
alter table if exists transport_partners
  add constraint transport_partners_type_check
  check (partner_type in ('tac', 'agregado'));

alter table if exists transport_partners drop constraint if exists transport_partners_status_check;
alter table if exists transport_partners
  add constraint transport_partners_status_check
  check (status in ('active', 'inactive'));

with numbered as (
  select id, row_number() over (partition by tenant_id order by created_at asc, id asc) as next_display_id
  from transport_partners
  where display_id is null
)
update transport_partners partner
set display_id = numbered.next_display_id
from numbered
where partner.id = numbered.id;

drop trigger if exists trg_transport_partners_display_id on transport_partners;
create trigger trg_transport_partners_display_id
before insert on transport_partners
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_transport_partners_tenant_display_id
  on transport_partners(tenant_id, display_id)
  where display_id is not null;

create index if not exists idx_transport_partners_tenant_id
  on transport_partners(tenant_id);

create index if not exists idx_transport_partners_status
  on transport_partners(tenant_id, status);

create unique index if not exists idx_transport_partners_tenant_document
  on transport_partners(tenant_id, document_number)
  where document_number is not null and document_number <> '';

-- Down Migration

drop index if exists idx_transport_partners_tenant_document;
drop index if exists idx_transport_partners_status;
drop index if exists idx_transport_partners_tenant_id;
drop index if exists idx_transport_partners_tenant_display_id;
drop trigger if exists trg_transport_partners_display_id on transport_partners;
drop table if exists transport_partners;
