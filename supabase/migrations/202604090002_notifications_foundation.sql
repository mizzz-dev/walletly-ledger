-- 通知機能の土台（予算超過・精算リマインド）
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  type text not null check (type in ('budget_exceeded', 'settlement_pending')),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  dedupe_key text not null,
  channel text check (channel in ('push', 'email')),
  push_sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (dedupe_key)
);

create index if not exists idx_notifications_user_read_created
  on public.notifications (user_id, is_read, created_at desc);

create index if not exists idx_notifications_household_created
  on public.notifications (household_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "通知は本人のみ参照可能" on public.notifications;
create policy "通知は本人のみ参照可能" on public.notifications
for select using (
  user_id = auth.uid()
  and public.is_household_member(household_id)
);

drop policy if exists "通知作成はowner/editorのみ" on public.notifications;
create policy "通知作成はowner/editorのみ" on public.notifications
for insert with check (
  public.can_edit_household(household_id)
  and public.is_household_member(household_id)
);

drop policy if exists "通知既読更新は本人のみ" on public.notifications;
create policy "通知既読更新は本人のみ" on public.notifications
for update using (
  user_id = auth.uid()
  and public.is_household_member(household_id)
)
with check (
  user_id = auth.uid()
  and public.is_household_member(household_id)
);
