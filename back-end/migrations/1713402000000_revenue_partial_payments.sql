create table if not exists revenue_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  revenue_id uuid not null references revenues(id) on delete cascade,
  amount numeric not null check (amount > 0),
  payment_date text not null,
  notes text,
  created_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table if exists revenues drop constraint if exists revenues_status_check;
alter table if exists revenues
  add constraint revenues_status_check check (status in ('pending', 'billed', 'partially_received', 'received', 'overdue', 'canceled'));

alter table if exists novalog_billing_items drop constraint if exists novalog_billing_items_status_check;
alter table if exists novalog_billing_items
  add constraint novalog_billing_items_status_check check (status in ('pending', 'billed', 'partially_received', 'received', 'overdue', 'canceled'));

insert into revenue_payments (
  tenant_id,
  revenue_id,
  amount,
  payment_date,
  notes,
  created_by_user_id,
  created_at
)
select r.tenant_id,
       r.id,
       r.amount,
       coalesce(to_char(r.received_at::date, 'YYYY-MM-DD'), r.due_date),
       'Baixa anterior importada automaticamente para historico de pagamentos.',
       r.updated_by_user_id,
       coalesce(r.received_at, r.updated_at, now())
from revenues r
where r.status = 'received'
  and not exists (
    select 1
    from revenue_payments p
    where p.tenant_id = r.tenant_id
      and p.revenue_id = r.id
  );

create index if not exists idx_revenue_payments_revenue_id on revenue_payments(tenant_id, revenue_id);
create index if not exists idx_revenue_payments_payment_date on revenue_payments(tenant_id, payment_date);
