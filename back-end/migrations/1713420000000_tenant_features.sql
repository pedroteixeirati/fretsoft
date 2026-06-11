-- Up Migration

create extension if not exists pgcrypto;

create table if not exists tenant_features (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  feature_key text not null,
  enabled boolean not null default false,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists tenant_features add column if not exists tenant_id uuid references tenants(id) on delete cascade;
alter table if exists tenant_features add column if not exists feature_key text;
alter table if exists tenant_features add column if not exists enabled boolean default false;
alter table if exists tenant_features add column if not exists created_by_user_id uuid references users(id) on delete set null;
alter table if exists tenant_features add column if not exists updated_by_user_id uuid references users(id) on delete set null;
alter table if exists tenant_features add column if not exists created_at timestamptz default now();
alter table if exists tenant_features add column if not exists updated_at timestamptz default now();

update tenant_features set enabled = false where enabled is null;
update tenant_features set created_at = now() where created_at is null;
update tenant_features set updated_at = now() where updated_at is null;

alter table if exists tenant_features alter column tenant_id set not null;
alter table if exists tenant_features alter column feature_key set not null;
alter table if exists tenant_features alter column enabled set not null;
alter table if exists tenant_features alter column created_at set not null;
alter table if exists tenant_features alter column updated_at set not null;

create unique index if not exists idx_tenant_features_tenant_key
  on tenant_features(tenant_id, feature_key);

create index if not exists idx_tenant_features_tenant_enabled
  on tenant_features(tenant_id, enabled);

-- Down Migration

drop index if exists idx_tenant_features_tenant_enabled;
drop index if exists idx_tenant_features_tenant_key;
drop table if exists tenant_features;
