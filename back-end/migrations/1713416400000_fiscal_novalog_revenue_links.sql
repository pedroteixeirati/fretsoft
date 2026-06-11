-- Up Migration

alter table if exists novalog_billing_items
  add column if not exists fiscal_document_id uuid references fiscal_documents(id) on delete set null;

alter table if exists revenues
  add column if not exists fiscal_document_id uuid references fiscal_documents(id) on delete set null;

create index if not exists idx_novalog_billing_items_fiscal_document_id
  on novalog_billing_items(tenant_id, fiscal_document_id)
  where fiscal_document_id is not null;

create index if not exists idx_revenues_fiscal_document_id
  on revenues(tenant_id, fiscal_document_id)
  where fiscal_document_id is not null;

create unique index if not exists idx_novalog_billing_items_unique_fiscal_document
  on novalog_billing_items(tenant_id, fiscal_document_id)
  where fiscal_document_id is not null and status <> 'canceled';

-- Down Migration

drop index if exists idx_novalog_billing_items_unique_fiscal_document;
drop index if exists idx_revenues_fiscal_document_id;
drop index if exists idx_novalog_billing_items_fiscal_document_id;

alter table if exists revenues
  drop column if exists fiscal_document_id;

alter table if exists novalog_billing_items
  drop column if exists fiscal_document_id;
