-- Up Migration

create extension if not exists pgcrypto;

create table if not exists service_orders (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  status text not null default 'open',
  opened_on date not null,
  closed_on date,
  odometer numeric(12, 2),
  provider_name text,
  description text not null,
  total_amount numeric(12, 2) not null default 0,
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists service_orders drop constraint if exists service_orders_status_check;
alter table if exists service_orders
  add constraint service_orders_status_check
  check (status in ('open', 'in_progress', 'completed', 'canceled'));

create table if not exists service_order_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  service_order_id uuid not null references service_orders(id) on delete cascade,
  item_type text not null default 'part',
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  supplier_name text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists service_order_items drop constraint if exists service_order_items_item_type_check;
alter table if exists service_order_items
  add constraint service_order_items_item_type_check
  check (item_type in ('part', 'labor'));

drop trigger if exists trg_service_orders_display_id on service_orders;
create trigger trg_service_orders_display_id
before insert on service_orders
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_service_orders_tenant_display_id
  on service_orders(tenant_id, display_id)
  where display_id is not null;

create index if not exists idx_service_orders_tenant_id
  on service_orders(tenant_id);

create index if not exists idx_service_orders_tenant_vehicle
  on service_orders(tenant_id, vehicle_id);

create index if not exists idx_service_orders_tenant_status
  on service_orders(tenant_id, status);

create index if not exists idx_service_orders_tenant_opened_on
  on service_orders(tenant_id, opened_on);

create index if not exists idx_service_order_items_order
  on service_order_items(tenant_id, service_order_id);

-- Down Migration

drop index if exists idx_service_order_items_order;
drop index if exists idx_service_orders_tenant_opened_on;
drop index if exists idx_service_orders_tenant_status;
drop index if exists idx_service_orders_tenant_vehicle;
drop index if exists idx_service_orders_tenant_id;
drop index if exists idx_service_orders_tenant_display_id;
drop trigger if exists trg_service_orders_display_id on service_orders;
drop table if exists service_order_items;
drop table if exists service_orders;
