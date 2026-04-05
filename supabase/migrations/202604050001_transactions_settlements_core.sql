-- 取引・分担・清算記録の本実装向け拡張
alter table public.transactions
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists currency text not null default 'JPY',
  add column if not exists merchant text,
  add column if not exists applied_preset_id uuid references public.category_split_presets(id),
  add column if not exists created_by uuid references public.users(id),
  add column if not exists updated_at timestamptz not null default now();

update public.transactions t
set household_id = l.household_id
from public.ledgers l
where t.ledger_id = l.id and t.household_id is null;

alter table public.transactions
  alter column household_id set not null;

create index if not exists idx_transactions_household_ledger_date
  on public.transactions (household_id, ledger_id, transaction_date desc, created_at desc);

alter table public.splits
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists ledger_id uuid references public.ledgers(id) on delete cascade,
  add column if not exists member_id uuid references public.memberships(id),
  add column if not exists share_amount numeric(12,2),
  add column if not exists created_at timestamptz not null default now();

update public.splits s
set
  household_id = t.household_id,
  ledger_id = t.ledger_id,
  member_id = s.membership_id,
  share_amount = s.amount
from public.transactions t
where s.transaction_id = t.id;

alter table public.splits
  alter column household_id set not null,
  alter column ledger_id set not null,
  alter column member_id set not null,
  alter column share_amount set not null;

create index if not exists idx_splits_transaction_id on public.splits (transaction_id);
create index if not exists idx_splits_household_ledger_member on public.splits (household_id, ledger_id, member_id);

alter table public.settlements
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists method text not null default '現金',
  add column if not exists created_by uuid references public.users(id),
  add column if not exists created_at timestamptz not null default now();

update public.settlements s
set household_id = l.household_id
from public.ledgers l
where s.ledger_id = l.id and s.household_id is null;

alter table public.settlements
  alter column household_id set not null;

create index if not exists idx_settlements_household_ledger_date
  on public.settlements (household_id, ledger_id, settled_on desc, created_at desc);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at_timestamp();
