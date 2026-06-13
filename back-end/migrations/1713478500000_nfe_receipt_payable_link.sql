-- Up Migration

alter table if exists fiscal_nfe_receipts
  add column if not exists used_payable_id uuid references payables(id) on delete set null;

create index if not exists idx_fiscal_nfe_receipts_used_payable
  on fiscal_nfe_receipts(tenant_id, used_payable_id);

-- Down Migration

drop index if exists idx_fiscal_nfe_receipts_used_payable;
alter table if exists fiscal_nfe_receipts drop column if exists used_payable_id;
