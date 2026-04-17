-- Up Migration

alter table if exists novalog_operation_entries alter column ticket_number drop not null;
alter table if exists novalog_operation_entries alter column fuel_station_name drop not null;
alter table if exists novalog_operation_entries alter column driver_name drop not null;
alter table if exists novalog_operation_entries alter column vehicle_label drop not null;
alter table if exists novalog_operation_entries alter column notes drop not null;
alter table if exists novalog_operation_entries alter column batch_key drop not null;
alter table if exists novalog_operation_entries alter column created_by_user_id drop not null;
alter table if exists novalog_operation_entries alter column updated_by_user_id drop not null;

-- Down Migration
