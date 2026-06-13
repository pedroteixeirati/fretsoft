-- Up Migration

create extension if not exists pgcrypto;

create table if not exists nfse_documents (
  id uuid primary key default gen_random_uuid(),
  display_id bigint,
  tenant_id uuid not null references tenants(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  reference text not null,
  status text not null default 'draft',
  competence_month text,
  service_amount numeric(14, 2) not null default 0,
  service_description text,
  iss_rate numeric(5, 2),
  iss_retained boolean not null default false,
  number text,
  series text,
  access_key text,
  protocol text,
  authorized_at text,
  xml_url text,
  pdf_url text,
  provider text,
  provider_document_id text,
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb not null default '{}'::jsonb,
  error_message text,
  created_by_user_id uuid references users(id) on delete set null,
  updated_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists nfse_documents drop constraint if exists nfse_documents_status_check;
alter table if exists nfse_documents
  add constraint nfse_documents_status_check
  check (status in ('draft', 'processing', 'authorized', 'rejected', 'canceled', 'error'));

drop trigger if exists trg_nfse_documents_display_id on nfse_documents;
create trigger trg_nfse_documents_display_id
before insert on nfse_documents
for each row execute function assign_tenant_display_id();

create unique index if not exists idx_nfse_documents_tenant_display_id
  on nfse_documents(tenant_id, display_id)
  where display_id is not null;
create unique index if not exists idx_nfse_documents_tenant_reference
  on nfse_documents(tenant_id, reference);
create index if not exists idx_nfse_documents_tenant_status
  on nfse_documents(tenant_id, status, created_at desc);
create index if not exists idx_nfse_documents_company
  on nfse_documents(tenant_id, company_id);

-- Down Migration

drop index if exists idx_nfse_documents_company;
drop index if exists idx_nfse_documents_tenant_status;
drop index if exists idx_nfse_documents_tenant_reference;
drop index if exists idx_nfse_documents_tenant_display_id;
drop trigger if exists trg_nfse_documents_display_id on nfse_documents;
drop table if exists nfse_documents;
