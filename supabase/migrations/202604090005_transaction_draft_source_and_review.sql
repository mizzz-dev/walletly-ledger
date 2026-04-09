-- transaction draft入力元の追跡と銀行レビュー補助カラム
alter table public.transactions
  add column if not exists source_type text not null default 'manual',
  add column if not exists source_reference_id text;

alter table public.bank_transactions
  add column if not exists skipped_at timestamptz;

create index if not exists idx_transactions_source_type_ref
  on public.transactions (source_type, source_reference_id)
  where source_reference_id is not null;

create index if not exists idx_bank_transactions_skipped
  on public.bank_transactions (household_id, ledger_id, skipped_at desc)
  where skipped_at is not null;
