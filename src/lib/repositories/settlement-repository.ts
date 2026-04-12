import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";

export interface SettlementInsertPayload {
  household_id: string;
  ledger_id: string;
  from_membership_id: string;
  to_membership_id: string;
  amount: number;
  method: string;
  note: string | null;
  settled_on: string;
  created_by: string;
}

export interface SettlementRow {
  from_membership_id: string;
  to_membership_id: string;
  amount: number;
  created_at?: string;
}

export interface TransactionSplitAggregateRow {
  payer_membership_id: string;
  amount: number;
  splits: { member_id: string; share_amount: number }[];
}

export const listSettlementBaseRows = async ({
  householdId,
  ledgerId,
}: {
  householdId: string;
  ledgerId: string;
}): Promise<{ transactions: TransactionSplitAggregateRow[]; settlements: SettlementRow[]; lastSettlementAt: string | null }> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const [{ data: txRows, error: txError }, { data: settlementRows, error: settlementError }] = await Promise.all([
    supabase
      .from("transactions")
      .select("payer_membership_id,amount,splits(member_id,share_amount)")
      .eq("household_id", householdId)
      .eq("ledger_id", ledgerId),
    supabase
      .from("settlements")
      .select("from_membership_id,to_membership_id,amount,created_at")
      .eq("household_id", householdId)
      .eq("ledger_id", ledgerId)
      .order("created_at", { ascending: false }),
  ]);

  if (txError) {
    throw new Error(`精算計算用の取引取得に失敗しました: ${txError.message}`);
  }

  if (settlementError) {
    throw new Error(`精算履歴の取得に失敗しました: ${settlementError.message}`);
  }

  return {
    transactions: (txRows ?? []) as TransactionSplitAggregateRow[],
    settlements: (settlementRows ?? []) as SettlementRow[],
    lastSettlementAt: ((settlementRows ?? []) as SettlementRow[])[0]?.created_at ?? null,
  };
};

export const createSettlementRecord = async (payload: SettlementInsertPayload) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.from("settlements").insert(payload).select("id").single();

  if (error) {
    throw new Error(`精算記録の保存に失敗しました: ${error.message}`);
  }

  return data.id as string;
};
