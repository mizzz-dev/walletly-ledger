import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";

export interface BudgetRow {
  id: string;
  household_id: string;
  ledger_id: string;
  category_id: string | null;
  period: string;
  amount: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  categories: { name: string } | { name: string }[] | null;
}

const toSingleCategory = (value: { name: string } | { name: string }[] | null): { name: string } | null => {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

export const listBudgetsByLedger = async ({
  householdId,
  ledgerId,
  period,
}: {
  householdId: string;
  ledgerId: string;
  period?: string;
}): Promise<BudgetRow[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  let query = supabase
    .from("budgets")
    .select("id,household_id,ledger_id,category_id,period,amount,created_by,created_at,updated_at,categories(name)")
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .order("category_id", { ascending: true, nullsFirst: true });

  if (period) {
    query = query.eq("period", period);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`予算一覧の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as BudgetRow[]).map((row) => ({
    ...row,
    categories: toSingleCategory(row.categories),
  }));
};

export const createBudget = async ({
  householdId,
  ledgerId,
  categoryId,
  period,
  amount,
  createdBy,
}: {
  householdId: string;
  ledgerId: string;
  categoryId: string | null;
  period: string;
  amount: number;
  createdBy: string;
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      household_id: householdId,
      ledger_id: ledgerId,
      category_id: categoryId,
      period,
      amount,
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`予算の作成に失敗しました: ${error.message}`);
  }

  return data.id as string;
};

export const updateBudget = async ({
  id,
  categoryId,
  period,
  amount,
}: {
  id: string;
  categoryId: string | null;
  period: string;
  amount: number;
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { error } = await supabase
    .from("budgets")
    .update({
      category_id: categoryId,
      period,
      amount,
    })
    .eq("id", id);

  if (error) {
    throw new Error(`予算の更新に失敗しました: ${error.message}`);
  }
};

export const deleteBudget = async (id: string) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) {
    throw new Error(`予算の削除に失敗しました: ${error.message}`);
  }
};
