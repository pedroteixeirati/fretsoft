-- Up Migration

create extension if not exists pgcrypto;

create table if not exists vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  document_type text not null default 'outro',
  identifier text,
  amount numeric(12, 2),
  due_date date not null,
  status text not null default 'active',
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists vehicle_documents drop constraint if exists vehicle_documents_document_type_check;
alter table if exists vehicle_documents
  add constraint vehicle_documents_document_type_check
  check (document_type in ('ipva', 'licenciamento', 'tacografo', 'extintor', 'seguro', 'inspecao', 'outro'));

alter table if exists vehicle_documents drop constraint if exists vehicle_documents_status_check;
alter table if exists vehicle_documents
  add constraint vehicle_documents_status_check
  check (status in ('active', 'archived'));

drop trigger if exists trg_vehicle_documents_display_id on vehicle_documents;
create trigger trg_vehicle_documents_display_id
before insert on vehicle_documents
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_vehicle_documents_tenant_display_id
  on vehicle_documents(tenant_id, display_id)
  where display_id is not null;

create index if not exists idx_vehicle_documents_tenant_id
  on vehicle_documents(tenant_id);

create index if not exists idx_vehicle_documents_tenant_vehicle
  on vehicle_documents(tenant_id, vehicle_id);

create index if not exists idx_vehicle_documents_tenant_due_date
  on vehicle_documents(tenant_id, status, due_date);

-- Down Migration

drop index if exists idx_vehicle_documents_tenant_due_date;
drop index if exists idx_vehicle_documents_tenant_vehicle;
drop index if exists idx_vehicle_documents_tenant_id;
drop index if exists idx_vehicle_documents_tenant_display_id;
drop trigger if exists trg_vehicle_documents_display_id on vehicle_documents;
drop table if exists vehicle_documents;
