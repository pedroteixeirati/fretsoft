-- Up Migration

create extension if not exists pgcrypto;

create table if not exists maintenance_inspections (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  status text not null default 'completed',
  inspected_on date not null,
  odometer numeric(12, 2),
  mechanic_name text,
  next_due_on date,
  next_due_km numeric(12, 2),
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists maintenance_inspections drop constraint if exists maintenance_inspections_status_check;
alter table if exists maintenance_inspections
  add constraint maintenance_inspections_status_check
  check (status in ('scheduled', 'completed'));

create table if not exists maintenance_inspection_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  inspection_id uuid not null references maintenance_inspections(id) on delete cascade,
  label text not null,
  result text not null default 'ok',
  observation text,
  created_at timestamptz not null default now()
);

alter table if exists maintenance_inspection_items drop constraint if exists maintenance_inspection_items_result_check;
alter table if exists maintenance_inspection_items
  add constraint maintenance_inspection_items_result_check
  check (result in ('ok', 'attention', 'na'));

drop trigger if exists trg_maintenance_inspections_display_id on maintenance_inspections;
create trigger trg_maintenance_inspections_display_id
before insert on maintenance_inspections
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_maintenance_inspections_tenant_display_id
  on maintenance_inspections(tenant_id, display_id)
  where display_id is not null;

create index if not exists idx_maintenance_inspections_tenant_id
  on maintenance_inspections(tenant_id);

create index if not exists idx_maintenance_inspections_tenant_vehicle
  on maintenance_inspections(tenant_id, vehicle_id);

create index if not exists idx_maintenance_inspections_next_due_on
  on maintenance_inspections(tenant_id, next_due_on);

create index if not exists idx_maintenance_inspection_items_inspection
  on maintenance_inspection_items(tenant_id, inspection_id);

-- Down Migration

drop index if exists idx_maintenance_inspection_items_inspection;
drop index if exists idx_maintenance_inspections_next_due_on;
drop index if exists idx_maintenance_inspections_tenant_vehicle;
drop index if exists idx_maintenance_inspections_tenant_id;
drop index if exists idx_maintenance_inspections_tenant_display_id;
drop trigger if exists trg_maintenance_inspections_display_id on maintenance_inspections;
drop table if exists maintenance_inspection_items;
drop table if exists maintenance_inspections;
