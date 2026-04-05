import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { CategoryOption } from "@/types/domain";
import { toCategoryOptions } from "@/lib/categories/format";

export const listCategoriesByLedgerId = async (ledgerId: string): Promise<CategoryOption[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,color,ledger_id")
    .eq("ledger_id", ledgerId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`カテゴリ一覧の取得に失敗しました: ${error.message}`);
  }

  return toCategoryOptions((data ?? []) as { id: string; name: string; color: string; ledger_id: string }[]);
};
