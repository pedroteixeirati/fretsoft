-- Up Migration

create extension if not exists pgcrypto;

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  cpf text,
  cnh_number text,
  cnh_category text,
  cnh_expires_on date,
  phone text,
  status text not null default 'active',
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists drivers drop constraint if exists drivers_status_check;
alter table if exists drivers add constraint drivers_status_check check (status in ('active', 'inactive'));

drop trigger if exists trg_drivers_display_id on drivers;
create trigger trg_drivers_display_id before insert on drivers
for each row execute function assign_tenant_display_id();

create unique index if not exists idx_drivers_tenant_display_id on drivers(tenant_id, display_id) where display_id is not null;
create index if not exists idx_drivers_tenant_id on drivers(tenant_id);
create index if not exists idx_drivers_tenant_status on drivers(tenant_id, status);

create table if not exists transport_lines (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  line_code text,
  client_name text,
  company_id uuid references companies(id) on delete set null,
  vehicle_id uuid references vehicles(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  shift text not null default 'manha',
  departure_time text,
  origin text,
  destination text,
  side text,
  seats integer,
  status text not null default 'active',
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists transport_lines drop constraint if exists transport_lines_shift_check;
alter table if exists transport_lines add constraint transport_lines_shift_check check (shift in ('manha', 'tarde', 'noite', 'integral'));
alter table if exists transport_lines drop constraint if exists transport_lines_status_check;
alter table if exists transport_lines add constraint transport_lines_status_check check (status in ('active', 'inactive'));

drop trigger if exists trg_transport_lines_display_id on transport_lines;
create trigger trg_transport_lines_display_id before insert on transport_lines
for each row execute function assign_tenant_display_id();

create unique index if not exists idx_transport_lines_tenant_display_id on transport_lines(tenant_id, display_id) where display_id is not null;
create index if not exists idx_transport_lines_tenant_id on transport_lines(tenant_id);
create index if not exists idx_transport_lines_tenant_status on transport_lines(tenant_id, status);
create index if not exists idx_transport_lines_vehicle on transport_lines(tenant_id, vehicle_id);
create index if not exists idx_transport_lines_driver on transport_lines(tenant_id, driver_id);

-- Down Migration

drop index if exists idx_transport_lines_driver;
drop index if exists idx_transport_lines_vehicle;
drop index if exists idx_transport_lines_tenant_status;
drop index if exists idx_transport_lines_tenant_id;
drop index if exists idx_transport_lines_tenant_display_id;
drop trigger if exists trg_transport_lines_display_id on transport_lines;
drop table if exists transport_lines;
drop index if exists idx_drivers_tenant_status;
drop index if exists idx_drivers_tenant_id;
drop index if exists idx_drivers_tenant_display_id;
drop trigger if exists trg_drivers_display_id on drivers;
drop table if exists drivers;
