import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";

interface DashboardTransactionRow {
  id: string;
  transaction_date: string;
  amount: number;
  category_id: string | null;
  categories: { name: string; color: string } | { name: string; color: string }[] | null;
}

export const listDashboardTransactions = async ({
  householdId,
  ledgerId,
}: {
  householdId: string;
  ledgerId: string;
}): Promise<DashboardTransactionRow[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("transactions")
    .select("id,transaction_date,amount,category_id,categories(name,color)")
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .order("transaction_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`ダッシュボード用の取引取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as DashboardTransactionRow[];
};
