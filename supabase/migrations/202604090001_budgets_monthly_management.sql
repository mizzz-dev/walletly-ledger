-- 予算管理の本実装向け拡張
alter table public.budgets
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists period text,
  add column if not exists created_by uuid references public.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.budgets b
set household_id = l.household_id
from public.ledgers l
where b.ledger_id = l.id and b.household_id is null;

update public.budgets
set period = coalesce(period, year_month)
where period is null;

update public.budgets b
set created_by = h.owner_user_id
from public.households h
where b.household_id = h.id and b.created_by is null;

alter table public.budgets
  drop column if exists year_month;

alter table public.budgets
  alter column household_id set not null,
  alter column period set not null,
  alter column amount set not null,
  alter column created_by set not null;

alter table public.budgets
  add constraint budgets_period_format_check
  check (period ~ '^\\d{4}-\\d{2}$');

alter table public.budgets
  add constraint budgets_amount_non_negative_check
  check (amount >= 0);

create unique index if not exists idx_budgets_household_ledger_period_category
  on public.budgets (household_id, ledger_id, period, coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid));

create index if not exists idx_budgets_household_ledger_period
  on public.budgets (household_id, ledger_id, period);

drop trigger if exists set_budgets_updated_at on public.budgets;
create trigger set_budgets_updated_at
before update on public.budgets
for each row execute function public.set_updated_at_timestamp();
