-- Up Migration

create extension if not exists pgcrypto;

create table if not exists inventory_items (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text,
  name text not null,
  category text,
  unit_cost numeric(12, 2) not null default 0,
  quantity numeric(12, 2) not null default 0,
  min_quantity numeric(12, 2),
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  inventory_item_id uuid not null references inventory_items(id) on delete cascade,
  movement_type text not null default 'in',
  quantity numeric(12, 2) not null,
  unit_cost numeric(12, 2),
  occurred_on date not null,
  reason text,
  service_order_id uuid references service_orders(id) on delete set null,
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table if exists inventory_movements drop constraint if exists inventory_movements_movement_type_check;
alter table if exists inventory_movements
  add constraint inventory_movements_movement_type_check
  check (movement_type in ('in', 'out'));

drop trigger if exists trg_inventory_items_display_id on inventory_items;
create trigger trg_inventory_items_display_id
before insert on inventory_items
for each row
execute function assign_tenant_display_id();

create unique index if not exists idx_inventory_items_tenant_display_id
  on inventory_items(tenant_id, display_id)
  where display_id is not null;

create index if not exists idx_inventory_items_tenant_id
  on inventory_items(tenant_id);

create index if not exists idx_inventory_items_tenant_category
  on inventory_items(tenant_id, category);

create unique index if not exists idx_inventory_items_tenant_code
  on inventory_items(tenant_id, code)
  where code is not null and code <> '';

create index if not exists idx_inventory_movements_item
  on inventory_movements(tenant_id, inventory_item_id);

create index if not exists idx_inventory_movements_occurred_on
  on inventory_movements(tenant_id, occurred_on);

-- Down Migration

drop index if exists idx_inventory_movements_occurred_on;
drop index if exists idx_inventory_movements_item;
drop index if exists idx_inventory_items_tenant_code;
drop index if exists idx_inventory_items_tenant_category;
drop index if exists idx_inventory_items_tenant_id;
drop index if exists idx_inventory_items_tenant_display_id;
drop trigger if exists trg_inventory_items_display_id on inventory_items;
drop table if exists inventory_movements;
drop table if exists inventory_items;
