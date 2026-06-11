-- Up Migration

alter table if exists freights add column if not exists execution_mode text not null default 'own_fleet';
alter table if exists freights add column if not exists transport_partner_id uuid references transport_partners(id) on delete set null;

update freights set execution_mode = 'own_fleet' where execution_mode is null;

alter table if exists freights drop constraint if exists freights_execution_mode_check;
alter table if exists freights
  add constraint freights_execution_mode_check
  check (execution_mode in ('own_fleet', 'third_party'));

create index if not exists idx_freights_transport_partner_id
  on freights(tenant_id, transport_partner_id);

alter table if exists novalog_operation_entries add column if not exists transport_partner_id uuid references transport_partners(id) on delete set null;

create index if not exists idx_novalog_operation_entries_transport_partner_id
  on novalog_operation_entries(tenant_id, transport_partner_id);

-- Down Migration

drop index if exists idx_novalog_operation_entries_transport_partner_id;
alter table if exists novalog_operation_entries drop column if exists transport_partner_id;

drop index if exists idx_freights_transport_partner_id;
alter table if exists freights drop constraint if exists freights_execution_mode_check;
alter table if exists freights drop column if exists transport_partner_id;
alter table if exists freights drop column if exists execution_mode;
