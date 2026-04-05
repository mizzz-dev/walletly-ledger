import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { LedgerOption } from "@/types/domain";

export const listLedgersByHouseholdId = async (householdId: string): Promise<LedgerOption[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("ledgers")
    .select("id,household_id,name,type,currency")
    .eq("household_id", householdId)
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`台帳一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((ledger) => ({
    id: ledger.id,
    householdId: ledger.household_id,
    name: ledger.name,
    type: ledger.type,
    currency: ledger.currency,
  }));
};
