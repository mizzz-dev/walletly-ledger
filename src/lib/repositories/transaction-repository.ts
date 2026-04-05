import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { SplitInsertPayload, TransactionInsertPayload } from "@/lib/transactions/payload";

export interface TransactionListRow {
  id: string;
  transaction_date: string;
  amount: number;
  note: string | null;
  merchant: string | null;
  categories: { name: string } | null;
  payer: { id: string; users: { display_name: string | null } | { display_name: string | null }[] } | null;
  preset: { name: string } | null;
}

export const createTransactionWithSplits = async ({
  transaction,
  splits,
}: {
  transaction: TransactionInsertPayload;
  splits: SplitInsertPayload[];
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data: transactionRow, error: transactionError } = await supabase
    .from("transactions")
    .insert(transaction)
    .select("id")
    .single();

  if (transactionError) {
    throw new Error(`取引の保存に失敗しました: ${transactionError.message}`);
  }

  const splitPayloads = splits.map((split) => ({ ...split, transaction_id: transactionRow.id }));
  const { error: splitError } = await supabase.from("splits").insert(splitPayloads);

  if (splitError) {
    await supabase.from("transactions").delete().eq("id", transactionRow.id);
    throw new Error(`分担の保存に失敗しました: ${splitError.message}`);
  }

  return transactionRow.id;
};

export const listTransactionsByLedger = async ({
  householdId,
  ledgerId,
}: {
  householdId: string;
  ledgerId: string;
}): Promise<TransactionListRow[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id,transaction_date,amount,note,merchant,categories(name),payer:memberships!transactions_payer_membership_id_fkey(id,users(display_name)),preset:category_split_presets!transactions_applied_preset_id_fkey(name)",
    )
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`取引一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as TransactionListRow[];
};
