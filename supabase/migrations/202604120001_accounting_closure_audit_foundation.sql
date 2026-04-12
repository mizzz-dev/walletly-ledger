-- 月次締め / 監査ログ基盤

do $$
begin
  if not exists (select 1 from pg_type where typname = 'closure_status') then
    create type public.closure_status as enum ('open', 'closed');
  end if;
end
$$;

create table if not exists public.ledger_closures (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  status public.closure_status not null default 'closed',
  closed_at timestamptz,
  closed_by uuid references public.users(id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_ledger_closures_period check (period_start <= period_end)
);

create unique index if not exists uq_ledger_closures_ledger_period
  on public.ledger_closures (ledger_id, period_start, period_end);

create index if not exists idx_ledger_closures_household_ledger_period
  on public.ledger_closures (household_id, ledger_id, period_start desc, period_end desc);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  ledger_id uuid references public.ledgers(id) on delete cascade,
  actor_user_id uuid not null references public.users(id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  before_json jsonb,
  after_json jsonb,
  metadata_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_household_ledger_created
  on public.audit_logs (household_id, ledger_id, created_at desc);

create index if not exists idx_audit_logs_entity
  on public.audit_logs (household_id, entity_type, entity_id, created_at desc);

create or replace function public.is_closed_period(
  target_household_id uuid,
  target_ledger_id uuid,
  target_date date
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.ledger_closures lc
    join public.ledgers l on l.id = lc.ledger_id
    where lc.household_id = target_household_id
      and lc.ledger_id = target_ledger_id
      and lc.status = 'closed'
      and l.type = 'work'
      and target_date between lc.period_start and lc.period_end
  );
$$;

create or replace function public.prevent_closed_period_mutation()
returns trigger
language plpgsql
as $$
declare
  target_household_id uuid;
  target_ledger_id uuid;
  target_date date;
  period_label text;
begin
  if TG_TABLE_NAME = 'transactions' then
    target_household_id := coalesce(new.household_id, old.household_id);
    target_ledger_id := coalesce(new.ledger_id, old.ledger_id);
    target_date := coalesce(new.transaction_date, old.transaction_date);
  elsif TG_TABLE_NAME = 'settlements' then
    target_household_id := coalesce(new.household_id, old.household_id);
    target_ledger_id := coalesce(new.ledger_id, old.ledger_id);
    target_date := coalesce(new.settled_on, old.settled_on);
  elsif TG_TABLE_NAME = 'journals' then
    target_household_id := coalesce(new.household_id, old.household_id);
    target_ledger_id := coalesce(new.ledger_id, old.ledger_id);
    target_date := coalesce(new.journal_date, old.journal_date);
  elsif TG_TABLE_NAME = 'journal_lines' then
    select j.household_id, j.ledger_id, j.journal_date
      into target_household_id, target_ledger_id, target_date
    from public.journals j
    where j.id = coalesce(new.journal_id, old.journal_id);
  else
    return coalesce(new, old);
  end if;

  if target_date is not null and public.is_closed_period(target_household_id, target_ledger_id, target_date) then
    period_label := to_char(date_trunc('month', target_date), 'YYYY-MM');
    raise exception '締め済み期間（%）のため更新できません', period_label;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists prevent_closed_period_transactions on public.transactions;
create trigger prevent_closed_period_transactions
before insert or update or delete on public.transactions
for each row execute function public.prevent_closed_period_mutation();

drop trigger if exists prevent_closed_period_settlements on public.settlements;
create trigger prevent_closed_period_settlements
before insert or update or delete on public.settlements
for each row execute function public.prevent_closed_period_mutation();

drop trigger if exists prevent_closed_period_journals on public.journals;
create trigger prevent_closed_period_journals
before insert or update or delete on public.journals
for each row execute function public.prevent_closed_period_mutation();

drop trigger if exists prevent_closed_period_journal_lines on public.journal_lines;
create trigger prevent_closed_period_journal_lines
before insert or update or delete on public.journal_lines
for each row execute function public.prevent_closed_period_mutation();

insert into public.ledger_closures (household_id, ledger_id, period_start, period_end, status, closed_at, closed_by, note)
select l.household_id,
       l.id,
       date_trunc('month', now())::date,
       (date_trunc('month', now()) + interval '1 month - 1 day')::date,
       'open'::public.closure_status,
       null,
       null,
       '初期レコード'
from public.ledgers l
where l.type = 'work'
on conflict (ledger_id, period_start, period_end) do nothing;
