-- Up Migration

alter table if exists cargo_insurance_policies
  add column if not exists endorsement_numbers jsonb not null default '[]'::jsonb;

alter table if exists cargo_insurance_policies drop constraint if exists cargo_insurance_policies_endorsement_numbers_check;
alter table if exists cargo_insurance_policies
  add constraint cargo_insurance_policies_endorsement_numbers_check
  check (jsonb_typeof(endorsement_numbers) = 'array');

-- Down Migration

alter table if exists cargo_insurance_policies drop constraint if exists cargo_insurance_policies_endorsement_numbers_check;
alter table if exists cargo_insurance_policies drop column if exists endorsement_numbers;
