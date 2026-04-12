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
alter table public.notifications enable row level security;
alter table public.bank_connections enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.imported_transaction_candidates enable row level security;
alter table public.account_masters enable row level security;
alter table public.journals enable row level security;
alter table public.journal_lines enable row level security;

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
      and m.role in ('owner', 'editor')
  );
$$;

create or replace function public.is_valid_household_membership(target_household_id uuid, target_membership_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.memberships m
    where m.household_id = target_household_id
      and m.id = target_membership_id
  );
$$;

create or replace function public.is_work_ledger(target_ledger_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.ledgers l
    where l.id = target_ledger_id
      and l.type = 'work'
  );
$$;

drop policy if exists "自身のプロフィールのみ参照" on public.users;
create policy "自身のプロフィールのみ参照" on public.users
for select using (auth.uid() = id);

drop policy if exists "所属世帯を参照" on public.households;
create policy "所属世帯を参照" on public.households
for select using (
  exists (
    select 1 from public.memberships m
    where m.household_id = households.id and m.user_id = auth.uid()
  )
);

drop policy if exists "所属メンバーを参照" on public.memberships;
create policy "所属メンバーを参照" on public.memberships
for select using (public.is_household_member(household_id));

drop policy if exists "所属に紐づくledgerを参照" on public.ledgers;
create policy "所属に紐づくledgerを参照" on public.ledgers
for select using (public.is_household_member(household_id));

drop policy if exists "所属に紐づくカテゴリを参照" on public.categories;
create policy "所属に紐づくカテゴリを参照" on public.categories
for select using (
  exists (
    select 1 from public.ledgers l
    where l.id = categories.ledger_id
      and public.is_household_member(l.household_id)
  )
);

drop policy if exists "プリセットは世帯メンバーのみ参照可能" on public.category_split_presets;
create policy "プリセットは世帯メンバーのみ参照可能" on public.category_split_presets
for select using (public.is_household_member(household_id));

drop policy if exists "プリセット作成はowner/editorのみ" on public.category_split_presets;
create policy "プリセット作成はowner/editorのみ" on public.category_split_presets
for insert with check (public.can_edit_household(household_id));

drop policy if exists "プリセット更新はowner/editorのみ" on public.category_split_presets;
create policy "プリセット更新はowner/editorのみ" on public.category_split_presets
for update using (public.can_edit_household(household_id));

drop policy if exists "予算は世帯メンバーのみ参照可能" on public.budgets;
create policy "予算は世帯メンバーのみ参照可能" on public.budgets
for select using (public.is_household_member(household_id));

drop policy if exists "予算作成はowner/editorのみ" on public.budgets;
create policy "予算作成はowner/editorのみ" on public.budgets
for insert with check (
  public.can_edit_household(household_id)
  and created_by = auth.uid()
);

drop policy if exists "予算更新はowner/editorのみ" on public.budgets;
create policy "予算更新はowner/editorのみ" on public.budgets
for update using (public.can_edit_household(household_id));

drop policy if exists "予算削除はowner/editorのみ" on public.budgets;
create policy "予算削除はowner/editorのみ" on public.budgets
for delete using (public.can_edit_household(household_id));

drop policy if exists "取引は世帯メンバーのみ参照可能" on public.transactions;
create policy "取引は世帯メンバーのみ参照可能" on public.transactions
for select using (public.is_household_member(household_id));

drop policy if exists "取引作成はowner/editorのみ" on public.transactions;
create policy "取引作成はowner/editorのみ" on public.transactions
for insert with check (
  public.can_edit_household(household_id)
  and created_by = auth.uid()
  and public.is_valid_household_membership(household_id, payer_membership_id)
);

drop policy if exists "分担は世帯メンバーのみ参照可能" on public.splits;
create policy "分担は世帯メンバーのみ参照可能" on public.splits
for select using (public.is_household_member(household_id));

drop policy if exists "分担作成はowner/editorのみ" on public.splits;
create policy "分担作成はowner/editorのみ" on public.splits
for insert with check (
  public.can_edit_household(household_id)
  and public.is_valid_household_membership(household_id, member_id)
);

drop policy if exists "清算記録は世帯メンバーのみ参照可能" on public.settlements;
create policy "清算記録は世帯メンバーのみ参照可能" on public.settlements
for select using (public.is_household_member(household_id));

drop policy if exists "清算記録作成はowner/editorのみ" on public.settlements;
create policy "清算記録作成はowner/editorのみ" on public.settlements
for insert with check (
  public.can_edit_household(household_id)
  and created_by = auth.uid()
  and public.is_valid_household_membership(household_id, from_membership_id)
  and public.is_valid_household_membership(household_id, to_membership_id)
);

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

alter table public.receipt_attachments enable row level security;

drop policy if exists "添付は世帯メンバーのみ参照可能" on public.receipt_attachments;
create policy "添付は世帯メンバーのみ参照可能" on public.receipt_attachments
for select using (public.is_household_member(household_id));

drop policy if exists "添付作成はowner/editorのみ" on public.receipt_attachments;
create policy "添付作成はowner/editorのみ" on public.receipt_attachments
for insert with check (
  public.can_edit_household(household_id)
  and uploaded_by = auth.uid()
);

drop policy if exists "添付更新はowner/editorのみ" on public.receipt_attachments;
create policy "添付更新はowner/editorのみ" on public.receipt_attachments
for update using (public.can_edit_household(household_id));

drop policy if exists "添付削除はowner/editorのみ" on public.receipt_attachments;
create policy "添付削除はowner/editorのみ" on public.receipt_attachments
for delete using (public.can_edit_household(household_id));

drop policy if exists "receipt画像は世帯メンバーのみ参照" on storage.objects;
create policy "receipt画像は世帯メンバーのみ参照" on storage.objects
for select using (
  bucket_id = 'receipt-attachments'
  and split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
  and public.is_household_member((split_part(name, '/', 1))::uuid)
);

drop policy if exists "receipt画像アップロードはowner/editorのみ" on storage.objects;
create policy "receipt画像アップロードはowner/editorのみ" on storage.objects
for insert with check (
  bucket_id = 'receipt-attachments'
  and split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
  and public.can_edit_household((split_part(name, '/', 1))::uuid)
);

drop policy if exists "receipt画像更新はowner/editorのみ" on storage.objects;
create policy "receipt画像更新はowner/editorのみ" on storage.objects
for update using (
  bucket_id = 'receipt-attachments'
  and split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
  and public.can_edit_household((split_part(name, '/', 1))::uuid)
);

drop policy if exists "receipt画像削除はowner/editorのみ" on storage.objects;
create policy "receipt画像削除はowner/editorのみ" on storage.objects
for delete using (
  bucket_id = 'receipt-attachments'
  and split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
  and public.can_edit_household((split_part(name, '/', 1))::uuid)
);


drop policy if exists "銀行接続は世帯メンバーのみ参照可能" on public.bank_connections;
create policy "銀行接続は世帯メンバーのみ参照可能" on public.bank_connections
for select using (public.is_household_member(household_id));

drop policy if exists "銀行接続作成はowner/editorのみ" on public.bank_connections;
create policy "銀行接続作成はowner/editorのみ" on public.bank_connections
for insert with check (
  public.can_edit_household(household_id)
  and created_by = auth.uid()
);

drop policy if exists "銀行接続更新はowner/editorのみ" on public.bank_connections;
create policy "銀行接続更新はowner/editorのみ" on public.bank_connections
for update using (public.can_edit_household(household_id));

drop policy if exists "銀行口座は世帯メンバーのみ参照可能" on public.bank_accounts;
create policy "銀行口座は世帯メンバーのみ参照可能" on public.bank_accounts
for select using (public.is_household_member(household_id));

drop policy if exists "銀行口座作成更新はowner/editorのみ" on public.bank_accounts;
create policy "銀行口座作成更新はowner/editorのみ" on public.bank_accounts
for all using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

drop policy if exists "銀行明細は世帯メンバーのみ参照可能" on public.bank_transactions;
create policy "銀行明細は世帯メンバーのみ参照可能" on public.bank_transactions
for select using (public.is_household_member(household_id));

drop policy if exists "銀行明細作成更新はowner/editorのみ" on public.bank_transactions;
create policy "銀行明細作成更新はowner/editorのみ" on public.bank_transactions
for all using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

drop policy if exists "取込候補は世帯メンバーのみ参照可能" on public.imported_transaction_candidates;
create policy "取込候補は世帯メンバーのみ参照可能" on public.imported_transaction_candidates
for select using (public.is_household_member(household_id));

drop policy if exists "取込候補作成更新はowner/editorのみ" on public.imported_transaction_candidates;
create policy "取込候補作成更新はowner/editorのみ" on public.imported_transaction_candidates
for all using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

drop policy if exists "勘定科目は世帯メンバーのみ参照可能" on public.account_masters;
create policy "勘定科目は世帯メンバーのみ参照可能" on public.account_masters
for select using (public.is_household_member(household_id));

drop policy if exists "勘定科目の作成更新はowner/editorのみ" on public.account_masters;
create policy "勘定科目の作成更新はowner/editorのみ" on public.account_masters
for all using (public.can_edit_household(household_id))
with check (public.can_edit_household(household_id));

drop policy if exists "仕訳は世帯メンバーのみ参照可能" on public.journals;
create policy "仕訳は世帯メンバーのみ参照可能" on public.journals
for select using (
  public.is_household_member(household_id)
  and public.is_work_ledger(ledger_id)
);

drop policy if exists "仕訳の作成更新はowner/editorのみ" on public.journals;
create policy "仕訳の作成更新はowner/editorのみ" on public.journals
for all using (
  public.can_edit_household(household_id)
  and public.is_work_ledger(ledger_id)
)
with check (
  public.can_edit_household(household_id)
  and public.is_work_ledger(ledger_id)
);

drop policy if exists "仕訳明細は世帯メンバーのみ参照可能" on public.journal_lines;
create policy "仕訳明細は世帯メンバーのみ参照可能" on public.journal_lines
for select using (
  exists (
    select 1 from public.journals j
    where j.id = journal_lines.journal_id
      and public.is_household_member(j.household_id)
      and public.is_work_ledger(j.ledger_id)
  )
);

drop policy if exists "仕訳明細の作成更新はowner/editorのみ" on public.journal_lines;
create policy "仕訳明細の作成更新はowner/editorのみ" on public.journal_lines
for all using (
  exists (
    select 1 from public.journals j
    where j.id = journal_lines.journal_id
      and public.can_edit_household(j.household_id)
      and public.is_work_ledger(j.ledger_id)
  )
)
with check (
  exists (
    select 1 from public.journals j
    where j.id = journal_lines.journal_id
      and public.can_edit_household(j.household_id)
      and public.is_work_ledger(j.ledger_id)
  )
);

alter table public.ledger_closures enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "月次締めは世帯メンバーのみ参照可能" on public.ledger_closures;
create policy "月次締めは世帯メンバーのみ参照可能" on public.ledger_closures
for select using (
  public.is_household_member(household_id)
  and public.is_work_ledger(ledger_id)
);

drop policy if exists "月次締めはowner/editorのみ作成更新" on public.ledger_closures;
create policy "月次締めはowner/editorのみ作成更新" on public.ledger_closures
for all using (
  public.can_edit_household(household_id)
  and public.is_work_ledger(ledger_id)
)
with check (
  public.can_edit_household(household_id)
  and public.is_work_ledger(ledger_id)
);

drop policy if exists "監査ログは世帯メンバーのみ参照可能" on public.audit_logs;
create policy "監査ログは世帯メンバーのみ参照可能" on public.audit_logs
for select using (
  public.is_household_member(household_id)
  and (ledger_id is null or public.is_work_ledger(ledger_id))
);

drop policy if exists "監査ログの作成はowner/editorのみ" on public.audit_logs;
create policy "監査ログの作成はowner/editorのみ" on public.audit_logs
for insert with check (
  public.can_edit_household(household_id)
  and (ledger_id is null or public.is_work_ledger(ledger_id))
  and actor_user_id = auth.uid()
);
