-- 銀行連携基盤（provider差し替えを前提にした接続・口座・明細・候補）
alter table public.bank_connections
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  alter column ledger_id drop not null,
  add column if not exists external_connection_id text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists created_by uuid references public.users(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists credential_payload jsonb not null default '{}'::jsonb;

update public.bank_connections bc
set household_id = l.household_id
from public.ledgers l
where bc.ledger_id = l.id and bc.household_id is null;

alter table public.bank_connections
  alter column household_id set not null;

create index if not exists idx_bank_connections_household_ledger
  on public.bank_connections (household_id, ledger_id, created_at desc);

alter table public.bank_accounts
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists ledger_id uuid references public.ledgers(id) on delete cascade,
  add column if not exists provider_account_id text,
  add column if not exists display_name text,
  add column if not exists account_type text not null default 'other',
  add column if not exists masked_account_number text,
  add column if not exists is_shared boolean not null default false,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.bank_accounts ba
set
  provider_account_id = coalesce(ba.provider_account_id, ba.external_account_id),
  display_name = coalesce(ba.display_name, ba.name),
  household_id = coalesce(ba.household_id, bc.household_id),
  ledger_id = coalesce(ba.ledger_id, bc.ledger_id)
from public.bank_connections bc
where ba.connection_id = bc.id;

alter table public.bank_accounts
  alter column household_id set not null,
  alter column provider_account_id set not null,
  alter column display_name set not null;

create unique index if not exists uq_bank_accounts_connection_provider_account
  on public.bank_accounts (connection_id, provider_account_id);

create index if not exists idx_bank_accounts_household_ledger
  on public.bank_accounts (household_id, ledger_id, created_at desc);

alter table public.bank_transactions
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists ledger_id uuid references public.ledgers(id) on delete cascade,
  add column if not exists provider_transaction_id text,
  add column if not exists posted_at date,
  add column if not exists booked_at date,
  add column if not exists currency text not null default 'JPY',
  add column if not exists direction text not null default 'outflow',
  add column if not exists counterparty text,
  add column if not exists raw_payload jsonb not null default '{}'::jsonb,
  add column if not exists transaction_hash text,
  add column if not exists imported_transaction_id uuid references public.transactions(id),
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

update public.bank_transactions bt
set
  household_id = coalesce(bt.household_id, ba.household_id),
  ledger_id = coalesce(bt.ledger_id, ba.ledger_id),
  posted_at = coalesce(bt.posted_at, bt.transaction_at::date),
  transaction_hash = coalesce(bt.transaction_hash, encode(digest(concat_ws('|', bt.bank_account_id::text, bt.transaction_at::text, bt.amount::text, coalesce(bt.description, '')), 'sha256'), 'hex')),
  imported_transaction_id = coalesce(bt.imported_transaction_id, bt.matched_transaction_id)
from public.bank_accounts ba
where bt.bank_account_id = ba.id;

alter table public.bank_transactions
  alter column household_id set not null,
  alter column posted_at set not null,
  alter column transaction_hash set not null;

create unique index if not exists uq_bank_transactions_account_hash
  on public.bank_transactions (bank_account_id, transaction_hash);

create unique index if not exists uq_bank_transactions_account_provider_id
  on public.bank_transactions (bank_account_id, provider_transaction_id)
  where provider_transaction_id is not null;

create index if not exists idx_bank_transactions_household_ledger_posted
  on public.bank_transactions (household_id, ledger_id, posted_at desc, created_at desc);

create table if not exists public.imported_transaction_candidates (
  id uuid primary key default gen_random_uuid(),
  bank_transaction_id uuid not null references public.bank_transactions(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  ledger_id uuid references public.ledgers(id) on delete cascade,
  suggested_amount numeric(12,2) not null,
  suggested_date date not null,
  suggested_merchant text not null,
  suggested_note text not null,
  suggested_category_id uuid references public.categories(id),
  match_status text not null default 'pending',
  confidence numeric(4,3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bank_transaction_id)
);

alter table public.transactions
  add column if not exists imported_bank_transaction_id uuid references public.bank_transactions(id);

create unique index if not exists uq_transactions_imported_bank_transaction
  on public.transactions (imported_bank_transaction_id)
  where imported_bank_transaction_id is not null;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_bank_connections_updated_at on public.bank_connections;
create trigger set_bank_connections_updated_at
before update on public.bank_connections
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists set_bank_accounts_updated_at on public.bank_accounts;
create trigger set_bank_accounts_updated_at
before update on public.bank_accounts
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists set_bank_transactions_updated_at on public.bank_transactions;
create trigger set_bank_transactions_updated_at
before update on public.bank_transactions
for each row execute function public.set_updated_at_timestamp();

drop trigger if exists set_imported_transaction_candidates_updated_at on public.imported_transaction_candidates;
create trigger set_imported_transaction_candidates_updated_at
before update on public.imported_transaction_candidates
for each row execute function public.set_updated_at_timestamp();
