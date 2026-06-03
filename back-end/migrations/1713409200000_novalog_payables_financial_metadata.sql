-- Up Migration

alter table if exists providers add column if not exists usage_type text not null default 'operational';
alter table if exists providers drop constraint if exists providers_usage_type_check;
alter table if exists providers
  add constraint providers_usage_type_check
  check (usage_type in ('operational', 'financial', 'both'));

alter table if exists payables add column if not exists document_number text;
alter table if exists payables add column if not exists invoice_number text;
alter table if exists payables add column if not exists invoice_status text not null default 'not_informed';
alter table if exists payables add column if not exists reference_month text;
alter table if exists payables add column if not exists import_batch_id uuid;
alter table if exists payables add column if not exists import_sheet_name text;
alter table if exists payables add column if not exists import_row_number integer;

update payables set invoice_status = 'not_informed' where invoice_status is null;

alter table if exists payables drop constraint if exists payables_invoice_status_check;
alter table if exists payables
  add constraint payables_invoice_status_check
  check (invoice_status in ('informed', 'missing', 'not_informed'));

create index if not exists idx_providers_tenant_usage_type on providers(tenant_id, usage_type);
create index if not exists idx_payables_tenant_reference_month on payables(tenant_id, reference_month);
create index if not exists idx_payables_tenant_invoice_number on payables(tenant_id, invoice_number);
create index if not exists idx_payables_tenant_document_number on payables(tenant_id, document_number);

-- Down Migration

drop index if exists idx_payables_tenant_document_number;
drop index if exists idx_payables_tenant_invoice_number;
drop index if exists idx_payables_tenant_reference_month;
drop index if exists idx_providers_tenant_usage_type;

alter table if exists payables drop constraint if exists payables_invoice_status_check;
alter table if exists payables drop column if exists import_row_number;
alter table if exists payables drop column if exists import_sheet_name;
alter table if exists payables drop column if exists import_batch_id;
alter table if exists payables drop column if exists reference_month;
alter table if exists payables drop column if exists invoice_status;
alter table if exists payables drop column if exists invoice_number;
alter table if exists payables drop column if exists document_number;

alter table if exists providers drop constraint if exists providers_usage_type_check;
alter table if exists providers drop column if exists usage_type;
