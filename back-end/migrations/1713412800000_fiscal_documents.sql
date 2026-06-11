-- Up Migration

create extension if not exists pgcrypto;

create table if not exists fiscal_documents (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_type text not null default 'cte',
  model text not null default '57',
  series text not null,
  number text not null,
  access_key text,
  status text not null default 'draft',
  issue_date text not null,
  due_date text,
  amount numeric not null default 0,
  origin_name text,
  destination_name text,
  taker_name text,
  protocol text,
  authorized_at timestamptz,
  xml text,
  dacte_url text,
  provider text,
  provider_document_id text,
  idempotency_key text,
  tax_data jsonb not null default '{}'::jsonb,
  emitter_snapshot jsonb not null default '{}'::jsonb,
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists fiscal_documents add column if not exists display_id bigint;
alter table if exists fiscal_documents add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists fiscal_documents add column if not exists document_type text default 'cte';
alter table if exists fiscal_documents add column if not exists model text default '57';
alter table if exists fiscal_documents add column if not exists series text;
alter table if exists fiscal_documents add column if not exists number text;
alter table if exists fiscal_documents add column if not exists access_key text;
alter table if exists fiscal_documents add column if not exists status text default 'draft';
alter table if exists fiscal_documents add column if not exists issue_date text;
alter table if exists fiscal_documents add column if not exists due_date text;
alter table if exists fiscal_documents add column if not exists amount numeric default 0;
alter table if exists fiscal_documents add column if not exists origin_name text;
alter table if exists fiscal_documents add column if not exists destination_name text;
alter table if exists fiscal_documents add column if not exists taker_name text;
alter table if exists fiscal_documents add column if not exists protocol text;
alter table if exists fiscal_documents add column if not exists authorized_at timestamptz;
alter table if exists fiscal_documents add column if not exists xml text;
alter table if exists fiscal_documents add column if not exists dacte_url text;
alter table if exists fiscal_documents add column if not exists provider text;
alter table if exists fiscal_documents add column if not exists provider_document_id text;
alter table if exists fiscal_documents add column if not exists idempotency_key text;
alter table if exists fiscal_documents add column if not exists tax_data jsonb default '{}'::jsonb;
alter table if exists fiscal_documents add column if not exists emitter_snapshot jsonb default '{}'::jsonb;
alter table if exists fiscal_documents add column if not exists notes text;
alter table if exists fiscal_documents add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table if exists fiscal_documents add column if not exists updated_by_user_id uuid references users(id) on delete set null;
alter table if exists fiscal_documents add column if not exists created_at timestamptz default now();
alter table if exists fiscal_documents add column if not exists updated_at timestamptz default now();

update fiscal_documents set document_type = 'cte' where document_type is null;
update fiscal_documents set model = '57' where model is null;
update fiscal_documents set status = 'draft' where status is null;
update fiscal_documents set amount = 0 where amount is null;
update fiscal_documents set tax_data = '{}'::jsonb where tax_data is null;
update fiscal_documents set emitter_snapshot = '{}'::jsonb where emitter_snapshot is null;
update fiscal_documents set created_at = now() where created_at is null;
update fiscal_documents set updated_at = now() where updated_at is null;

alter table if exists fiscal_documents alter column tenant_id set not null;
alter table if exists fiscal_documents alter column document_type set not null;
alter table if exists fiscal_documents alter column model set not null;
alter table if exists fiscal_documents alter column series set not null;
alter table if exists fiscal_documents alter column number set not null;
alter table if exists fiscal_documents alter column status set not null;
alter table if exists fiscal_documents alter column issue_date set not null;
alter table if exists fiscal_documents alter column amount set not null;
alter table if exists fiscal_documents alter column tax_data set not null;
alter table if exists fiscal_documents alter column emitter_snapshot set not null;
alter table if exists fiscal_documents alter column created_at set not null;
alter table if exists fiscal_documents alter column updated_at set not null;

alter table if exists fiscal_documents drop constraint if exists fiscal_documents_type_check;
alter table if exists fiscal_documents
  add constraint fiscal_documents_type_check
  check (document_type in ('cte', 'cte_os', 'mdfe'));

alter table if exists fiscal_documents drop constraint if exists fiscal_documents_status_check;
alter table if exists fiscal_documents
  add constraint fiscal_documents_status_check
  check (status in ('draft', 'processing', 'authorized', 'rejected', 'canceled', 'denied', 'inutilized', 'error'));

create table if not exists fiscal_document_parties (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  fiscal_document_id uuid not null references fiscal_documents(id) on delete cascade,
  role text not null,
  name text not null,
  document_number text,
  state_registration text,
  city text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists fiscal_document_parties add column if not exists display_id bigint;
alter table if exists fiscal_document_parties add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists fiscal_document_parties add column if not exists fiscal_document_id uuid references fiscal_documents(id) on delete cascade;
alter table if exists fiscal_document_parties add column if not exists role text;
alter table if exists fiscal_document_parties add column if not exists name text;
alter table if exists fiscal_document_parties add column if not exists document_number text;
alter table if exists fiscal_document_parties add column if not exists state_registration text;
alter table if exists fiscal_document_parties add column if not exists city text;
alter table if exists fiscal_document_parties add column if not exists state text;
alter table if exists fiscal_document_parties add column if not exists created_at timestamptz default now();
alter table if exists fiscal_document_parties add column if not exists updated_at timestamptz default now();

alter table if exists fiscal_document_parties alter column tenant_id set not null;
alter table if exists fiscal_document_parties alter column fiscal_document_id set not null;
alter table if exists fiscal_document_parties alter column role set not null;
alter table if exists fiscal_document_parties alter column name set not null;
alter table if exists fiscal_document_parties alter column created_at set not null;
alter table if exists fiscal_document_parties alter column updated_at set not null;

alter table if exists fiscal_document_parties drop constraint if exists fiscal_document_parties_role_check;
alter table if exists fiscal_document_parties
  add constraint fiscal_document_parties_role_check
  check (role in ('taker', 'sender', 'recipient', 'dispatcher', 'receiver'));

create table if not exists fiscal_document_freights (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  fiscal_document_id uuid not null references fiscal_documents(id) on delete cascade,
  freight_id uuid not null references freights(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (tenant_id, fiscal_document_id, freight_id)
);

alter table if exists fiscal_document_freights add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists fiscal_document_freights add column if not exists fiscal_document_id uuid references fiscal_documents(id) on delete cascade;
alter table if exists fiscal_document_freights add column if not exists freight_id uuid references freights(id) on delete cascade;
alter table if exists fiscal_document_freights add column if not exists created_at timestamptz default now();

create table if not exists fiscal_events (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  fiscal_document_id uuid not null references fiscal_documents(id) on delete cascade,
  event_type text not null,
  status text not null default 'registered',
  reason text,
  protocol text,
  xml text,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table if exists fiscal_events add column if not exists display_id bigint;
alter table if exists fiscal_events add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists fiscal_events add column if not exists fiscal_document_id uuid references fiscal_documents(id) on delete cascade;
alter table if exists fiscal_events add column if not exists event_type text;
alter table if exists fiscal_events add column if not exists status text default 'registered';
alter table if exists fiscal_events add column if not exists reason text;
alter table if exists fiscal_events add column if not exists protocol text;
alter table if exists fiscal_events add column if not exists xml text;
alter table if exists fiscal_events add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table if exists fiscal_events add column if not exists created_at timestamptz default now();

create table if not exists fiscal_communication_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  fiscal_document_id uuid references fiscal_documents(id) on delete set null,
  provider text not null,
  operation text not null,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  http_status integer,
  error_message text,
  duration_ms integer,
  created_at timestamptz not null default now()
);

alter table if exists fiscal_communication_logs add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists fiscal_communication_logs add column if not exists fiscal_document_id uuid references fiscal_documents(id) on delete set null;
alter table if exists fiscal_communication_logs add column if not exists provider text;
alter table if exists fiscal_communication_logs add column if not exists operation text;
alter table if exists fiscal_communication_logs add column if not exists request_payload jsonb default '{}'::jsonb;
alter table if exists fiscal_communication_logs add column if not exists response_payload jsonb default '{}'::jsonb;
alter table if exists fiscal_communication_logs add column if not exists http_status integer;
alter table if exists fiscal_communication_logs add column if not exists error_message text;
alter table if exists fiscal_communication_logs add column if not exists duration_ms integer;
alter table if exists fiscal_communication_logs add column if not exists created_at timestamptz default now();

with numbered as (
  select id, row_number() over (partition by tenant_id order by created_at asc, id asc) as next_display_id
  from fiscal_documents
  where display_id is null
)
update fiscal_documents document
set display_id = numbered.next_display_id
from numbered
where document.id = numbered.id;

drop trigger if exists trg_fiscal_documents_display_id on fiscal_documents;
create trigger trg_fiscal_documents_display_id
before insert on fiscal_documents
for each row
execute function assign_tenant_display_id();

drop trigger if exists trg_fiscal_document_parties_display_id on fiscal_document_parties;
create trigger trg_fiscal_document_parties_display_id
before insert on fiscal_document_parties
for each row
execute function assign_tenant_display_id();

drop trigger if exists trg_fiscal_events_display_id on fiscal_events;
create trigger trg_fiscal_events_display_id
before insert on fiscal_events
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_fiscal_documents_tenant_display_id
  on fiscal_documents(tenant_id, display_id)
  where display_id is not null;

create unique index if not exists idx_fiscal_documents_tenant_type_series_number
  on fiscal_documents(tenant_id, document_type, series, number)
  where status <> 'canceled';

create unique index if not exists idx_fiscal_documents_tenant_access_key
  on fiscal_documents(tenant_id, access_key)
  where access_key is not null and access_key <> '';

create unique index if not exists idx_fiscal_documents_tenant_idempotency
  on fiscal_documents(tenant_id, idempotency_key)
  where idempotency_key is not null and idempotency_key <> '';

create index if not exists idx_fiscal_documents_tenant_status
  on fiscal_documents(tenant_id, status);

create index if not exists idx_fiscal_documents_tenant_issue_date
  on fiscal_documents(tenant_id, issue_date);

create index if not exists idx_fiscal_document_parties_document
  on fiscal_document_parties(tenant_id, fiscal_document_id);

create index if not exists idx_fiscal_document_freights_document
  on fiscal_document_freights(tenant_id, fiscal_document_id);

create index if not exists idx_fiscal_events_document
  on fiscal_events(tenant_id, fiscal_document_id);

create index if not exists idx_fiscal_communication_logs_document
  on fiscal_communication_logs(tenant_id, fiscal_document_id);

-- Down Migration

drop index if exists idx_fiscal_communication_logs_document;
drop index if exists idx_fiscal_events_document;
drop index if exists idx_fiscal_document_freights_document;
drop index if exists idx_fiscal_document_parties_document;
drop index if exists idx_fiscal_documents_tenant_issue_date;
drop index if exists idx_fiscal_documents_tenant_status;
drop index if exists idx_fiscal_documents_tenant_idempotency;
drop index if exists idx_fiscal_documents_tenant_access_key;
drop index if exists idx_fiscal_documents_tenant_type_series_number;
drop index if exists idx_fiscal_documents_tenant_display_id;

drop trigger if exists trg_fiscal_events_display_id on fiscal_events;
drop trigger if exists trg_fiscal_document_parties_display_id on fiscal_document_parties;
drop trigger if exists trg_fiscal_documents_display_id on fiscal_documents;

drop table if exists fiscal_communication_logs;
drop table if exists fiscal_events;
drop table if exists fiscal_document_freights;
drop table if exists fiscal_document_parties;
drop table if exists fiscal_documents;
