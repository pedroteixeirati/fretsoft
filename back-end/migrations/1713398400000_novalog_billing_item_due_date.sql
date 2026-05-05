-- Up Migration

alter table if exists novalog_billing_items
  add column if not exists due_date text;

update novalog_billing_items item
set due_date = billing.due_date
from novalog_billings billing
where item.billing_id = billing.id
  and item.tenant_id = billing.tenant_id
  and item.due_date is null;

create index if not exists idx_novalog_billing_items_due_date
  on novalog_billing_items(tenant_id, due_date);

-- Down Migration

drop index if exists idx_novalog_billing_items_due_date;

alter table if exists novalog_billing_items
  drop column if exists due_date;
