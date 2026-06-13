-- Up Migration

create extension if not exists pgcrypto;

create table if not exists tenant_nfse_config (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  service_code text,
  service_list_item text,
  cnae_code text,
  iss_rate numeric(5, 2),
  iss_retained boolean not null default false,
  special_regime text,
  municipal_incidence_ibge text,
  default_service_description text,
  enabled boolean not null default false,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_tenant_nfse_config_tenant on tenant_nfse_config(tenant_id);

-- Codigo IBGE do municipio do tomador (cliente), necessario para a NFS-e nacional.
alter table if exists companies add column if not exists ibge_code text;

-- Down Migration

alter table if exists companies drop column if exists ibge_code;
drop index if exists idx_tenant_nfse_config_tenant;
drop table if exists tenant_nfse_config;
