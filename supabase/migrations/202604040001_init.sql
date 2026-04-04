-- walletly-shared 初期スキーマ
create extension if not exists "pgcrypto";

create type ledger_type as enum ('family', 'work', 'custom');
create type preset_status as enum ('draft', 'published', 'archived');

create table if not exists public.users (
  id uuid primary key references auth.users(id),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references public.users(id),
  role text not null default 'member',
  unique (household_id, user_id)
);

create table if not exists public.ledgers (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  type ledger_type not null,
  currency text not null default 'JPY',
  archived_at timestamptz
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  name text not null,
  color text not null default '#7c6cff'
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  payer_membership_id uuid not null references public.memberships(id),
  amount numeric(12,2) not null check (amount > 0),
  note text,
  transaction_date date not null,
  receipt_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.splits (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  membership_id uuid not null references public.memberships(id),
  amount numeric(12,2) not null,
  method text not null,
  rule_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  from_membership_id uuid not null references public.memberships(id),
  to_membership_id uuid not null references public.memberships(id),
  amount numeric(12,2) not null check (amount > 0),
  settled_on date not null,
  note text
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  category_id uuid references public.categories(id),
  year_month text not null,
  amount numeric(12,2) not null
);

create table if not exists public.category_split_presets (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  name text not null,
  status preset_status not null default 'draft',
  priority int not null default 100,
  categories jsonb not null default '[]'::jsonb,
  split_method text not null,
  split_payload jsonb not null default '{}'::jsonb,
  conditions jsonb not null default '{}'::jsonb,
  rounding_mode text not null default 'round',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

-- 仕事向け拡張の雛形
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  journal_date date not null,
  description text
);

create table if not exists public.journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals(id) on delete cascade,
  account_code text not null,
  tax_code text,
  debit numeric(12,2) not null default 0,
  credit numeric(12,2) not null default 0
);

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  provider text not null,
  status text not null default 'pending',
  encrypted_tokens jsonb not null default '{}'::jsonb
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.bank_connections(id) on delete cascade,
  external_account_id text not null,
  name text not null,
  currency text not null default 'JPY'
);

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid not null references public.bank_accounts(id) on delete cascade,
  transaction_at timestamptz not null,
  amount numeric(12,2) not null,
  description text,
  matched_transaction_id uuid references public.transactions(id)
);
