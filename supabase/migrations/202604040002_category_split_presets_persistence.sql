-- 分割プリセット永続化向けの列追加と整形
alter table public.category_split_presets
  add column if not exists household_id uuid references public.households(id) on delete cascade,
  add column if not exists category_ids text[] not null default '{}',
  add column if not exists mode text,
  add column if not exists ratio numeric[] not null default '{}',
  add column if not exists weights numeric[] not null default '{}',
  add column if not exists fixed_amounts numeric[] not null default '{}',
  add column if not exists rounding text not null default 'round',
  add column if not exists is_default boolean not null default false,
  add column if not exists created_by uuid references public.users(id),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists member_ids text[] not null default '{}';

update public.category_split_presets p
set household_id = l.household_id
from public.ledgers l
where p.ledger_id = l.id and p.household_id is null;

update public.category_split_presets
set category_ids = coalesce(array(select jsonb_array_elements_text(categories)), '{}')
where categories is not null and cardinality(category_ids) = 0;

update public.category_split_presets
set mode = split_method
where mode is null;

update public.category_split_presets
set rounding = rounding_mode
where rounding is null or rounding = '';

update public.category_split_presets
set updated_at = created_at
where updated_at is null;

alter table public.category_split_presets
  alter column household_id set not null,
  alter column mode set not null,
  alter column ledger_id drop not null;

create index if not exists idx_category_split_presets_household_status_priority
  on public.category_split_presets (household_id, status, priority desc, updated_at desc);

create index if not exists idx_category_split_presets_categories
  on public.category_split_presets using gin (category_ids);

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_category_split_presets_updated_at on public.category_split_presets;
create trigger set_category_split_presets_updated_at
before update on public.category_split_presets
for each row execute function public.set_updated_at_timestamp();
