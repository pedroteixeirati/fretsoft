-- Up Migration

alter table if exists fiscal_documents add column if not exists source_freight_id uuid references freights(id) on delete set null;

create index if not exists idx_fiscal_documents_source_freight_id
  on fiscal_documents(tenant_id, source_freight_id);

-- Idempotencia: no maximo um documento fiscal nao-cancelado por frete de origem.
create unique index if not exists idx_fiscal_documents_unique_source_freight
  on fiscal_documents(source_freight_id)
  where source_freight_id is not null and status <> 'canceled';

-- Down Migration

drop index if exists idx_fiscal_documents_unique_source_freight;
drop index if exists idx_fiscal_documents_source_freight_id;
alter table if exists fiscal_documents drop column if exists source_freight_id;
