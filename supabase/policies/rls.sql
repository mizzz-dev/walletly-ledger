alter table public.users enable row level security;
alter table public.households enable row level security;
alter table public.memberships enable row level security;
alter table public.ledgers enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.splits enable row level security;
alter table public.settlements enable row level security;
alter table public.budgets enable row level security;
alter table public.category_split_presets enable row level security;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.household_id = target_household_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_household(target_household_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.household_id = target_household_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'editor', 'member')
  );
$$;

create policy "自身のプロフィールのみ参照" on public.users
for select using (auth.uid() = id);

create policy "所属世帯を参照" on public.households
for select using (
  exists (
    select 1 from public.memberships m
    where m.household_id = households.id and m.user_id = auth.uid()
  )
);

create policy "所属に紐づくledgerを参照" on public.ledgers
for select using (
  exists (
    select 1
    from public.memberships m
    where m.household_id = ledgers.household_id and m.user_id = auth.uid()
  )
);

create policy "プリセットは世帯メンバーのみ参照可能" on public.category_split_presets
for select using (public.is_household_member(household_id));

create policy "プリセット作成はowner/editorのみ" on public.category_split_presets
for insert with check (public.can_edit_household(household_id));

create policy "プリセット更新はowner/editorのみ" on public.category_split_presets
for update using (public.can_edit_household(household_id));
