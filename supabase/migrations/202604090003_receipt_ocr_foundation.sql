-- レシート添付 + OCR下書き基盤
create table if not exists public.receipt_attachments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  ledger_id uuid not null references public.ledgers(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  uploaded_by uuid not null references public.users(id),
  storage_path text not null unique,
  file_name text not null,
  content_type text not null,
  file_size bigint not null check (file_size > 0),
  ocr_status text not null default 'pending',
  ocr_raw_text text,
  ocr_confidence numeric(5,4),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint receipt_attachments_ocr_status_check check (ocr_status in ('pending', 'completed', 'failed'))
);

create index if not exists idx_receipt_attachments_household_ledger_created_at
  on public.receipt_attachments (household_id, ledger_id, created_at desc);

create index if not exists idx_receipt_attachments_transaction_id
  on public.receipt_attachments (transaction_id);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_receipt_attachments_updated_at on public.receipt_attachments;
create trigger set_receipt_attachments_updated_at
before update on public.receipt_attachments
for each row execute function public.set_updated_at_timestamp();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipt-attachments',
  'receipt-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;
