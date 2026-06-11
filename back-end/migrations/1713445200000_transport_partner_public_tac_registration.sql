-- Up Migration

alter table if exists transport_partners add column if not exists phone text;
alter table if exists transport_partners add column if not exists receipt_method text;
alter table if exists transport_partners add column if not exists approval_status text not null default 'pending';
alter table if exists transport_partners add column if not exists approved_by_user_id uuid references users(id) on delete set null;
alter table if exists transport_partners add column if not exists approved_at timestamptz;
alter table if exists transport_partners add column if not exists accepted_responsibility_at timestamptz;
alter table if exists transport_partners add column if not exists accepted_lgpd_at timestamptz;
alter table if exists transport_partners add column if not exists public_submitted_at timestamptz;

update transport_partners set approval_status = 'approved'
where public_submitted_at is null
  and (
    approval_status is null
    or approval_status = 'pending'
  );

alter table if exists transport_partners drop constraint if exists transport_partners_receipt_method_check;
alter table if exists transport_partners
  add constraint transport_partners_receipt_method_check
  check (receipt_method is null or receipt_method in ('pix', 'bank_transfer', 'both'));

alter table if exists transport_partners drop constraint if exists transport_partners_approval_status_check;
alter table if exists transport_partners
  add constraint transport_partners_approval_status_check
  check (approval_status in ('pending', 'approved', 'rejected'));

create index if not exists idx_transport_partners_approval_status
  on transport_partners(tenant_id, approval_status);

-- Down Migration

drop index if exists idx_transport_partners_approval_status;
alter table if exists transport_partners drop constraint if exists transport_partners_approval_status_check;
alter table if exists transport_partners drop constraint if exists transport_partners_receipt_method_check;
alter table if exists transport_partners drop column if exists public_submitted_at;
alter table if exists transport_partners drop column if exists accepted_lgpd_at;
alter table if exists transport_partners drop column if exists accepted_responsibility_at;
alter table if exists transport_partners drop column if exists approved_at;
alter table if exists transport_partners drop column if exists approved_by_user_id;
alter table if exists transport_partners drop column if exists approval_status;
alter table if exists transport_partners drop column if exists receipt_method;
alter table if exists transport_partners drop column if exists phone;
