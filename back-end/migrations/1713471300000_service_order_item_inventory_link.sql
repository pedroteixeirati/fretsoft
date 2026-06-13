-- Up Migration

alter table if exists service_order_items
  add column if not exists inventory_item_id uuid references inventory_items(id) on delete set null;

create index if not exists idx_service_order_items_inventory_item
  on service_order_items(tenant_id, inventory_item_id);

-- Down Migration

drop index if exists idx_service_order_items_inventory_item;
alter table if exists service_order_items drop column if exists inventory_item_id;
