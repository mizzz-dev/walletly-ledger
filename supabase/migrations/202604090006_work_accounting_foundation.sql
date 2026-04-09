-- work台帳向け会計モード基盤（勘定科目・仕訳・税区分コード）
do $$
begin
  if not exists (select 1 from pg_type where typname = 'account_category') then
    create type public.account_category as enum ('asset', 'liability', 'equity', 'revenue', 'expense');
  end if;
  if not exists (select 1 from pg_type where typname = 'journal_status') then
    create type public.journal_status as enum ('draft', 'posted');
  end if;
  if not exists (select 1 from pg_type where typname = 'debit_credit') then
    create type public.debit_credit as enum ('debit', 'credit');
  end if;
  if not exists (select 1 from pg_type where typname = 'journal_source_type') then
    create type public.journal_source_type as enum ('manual', 'transaction', 'bank', 'ocr');
  end if;
end
$$;

create table if not exists public.account_masters (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  ledger_id uuid references public.ledgers(id) on delete cascade,
  code text not null,
  name text not null,
  category public.account_category not null,
  is_active boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_account_masters_household_common_code
  on public.account_masters (household_id, code)
  where ledger_id is null;

create unique index if not exists uq_account_masters_ledger_code
  on public.account_masters (ledger_id, code)
  where ledger_id is not null;

create index if not exists idx_account_masters_household_ledger
  on public.account_masters (household_id, ledger_id, is_active, sort_order, code);

alter table public.journals
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists source_type public.journal_source_type,
  add column if not exists source_reference_id text,
  add column if not exists status public.journal_status not null default 'draft',
  add column if not exists created_by uuid references public.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.journals j
set household_id = l.household_id
from public.ledgers l
where j.ledger_id = l.id and j.household_id is null;

alter table public.journals alter column household_id set not null;
alter table public.journals alter column created_by set default auth.uid();

create index if not exists idx_journals_household_ledger_date
  on public.journals (household_id, ledger_id, journal_date desc, created_at desc);

create unique index if not exists uq_journals_source
  on public.journals (ledger_id, source_type, source_reference_id)
  where source_reference_id is not null;

alter table public.journal_lines
  add column if not exists line_no int,
  add column if not exists account_id uuid references public.account_masters(id),
  add column if not exists dc public.debit_credit,
  add column if not exists amount numeric(12,2),
  add column if not exists memo text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

with numbered as (
  select id, row_number() over (partition by journal_id order by id) as calculated_line_no
  from public.journal_lines
)
update public.journal_lines jl
set
  line_no = coalesce(jl.line_no, numbered.calculated_line_no),
  dc = coalesce(jl.dc, case when jl.debit > 0 then 'debit'::public.debit_credit else 'credit'::public.debit_credit end),
  amount = coalesce(jl.amount, case when jl.debit > 0 then jl.debit else jl.credit end)
from numbered
where jl.id = numbered.id
  and (jl.line_no is null or jl.dc is null or jl.amount is null);

alter table public.journal_lines
  alter column line_no set not null,
  alter column dc set not null,
  alter column amount set not null;

create index if not exists idx_journal_lines_journal_line_no
  on public.journal_lines (journal_id, line_no);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_account_masters_updated_at on public.account_masters;
create trigger set_account_masters_updated_at
before update on public.account_masters
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists set_journals_updated_at on public.journals;
create trigger set_journals_updated_at
before update on public.journals
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists set_journal_lines_updated_at on public.journal_lines;
create trigger set_journal_lines_updated_at
before update on public.journal_lines
for each row execute function public.set_updated_at_timestamp();

insert into public.account_masters (household_id, ledger_id, code, name, category, sort_order)
select l.household_id, l.id, seed.code, seed.name, seed.category::public.account_category, seed.sort_order
from public.ledgers l
cross join (
  values
    ('101', '現金', 'asset', 10),
    ('111', '普通預金', 'asset', 20),
    ('211', '未払金', 'liability', 30),
    ('611', '消耗品費', 'expense', 110),
    ('621', '旅費交通費', 'expense', 120),
    ('631', '通信費', 'expense', 130),
    ('641', '会議費', 'expense', 140),
    ('651', '水道光熱費', 'expense', 150),
    ('701', '売上高', 'revenue', 210)
) as seed(code, name, category, sort_order)
where l.type = 'work'
on conflict do nothing;
