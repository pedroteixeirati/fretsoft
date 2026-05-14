alter table if exists revenue_payments
  add column if not exists status text not null default 'active',
  add column if not exists reversed_at timestamptz,
  add column if not exists reversed_by_user_id uuid references users(id) on delete set null,
  add column if not exists reversal_reason text;

alter table if exists revenue_payments drop constraint if exists revenue_payments_status_check;
alter table if exists revenue_payments
  add constraint revenue_payments_status_check check (status in ('active', 'reversed'));

update revenue_payments
set status = 'active'
where status is null;

create index if not exists idx_revenue_payments_active_totals
  on revenue_payments(tenant_id, revenue_id)
  where status = 'active';
