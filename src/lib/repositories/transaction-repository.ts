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


export interface TransactionMatchRow {
  id: string;
  transaction_date: string;
  amount: number;
  note: string | null;
  merchant: string | null;
  category_id: string | null;
  imported_bank_transaction_id: string | null;
  source_type: "manual" | "ocr" | "bank" | null;
  source_reference_id: string | null;
}

export const listMatchingTransactionCandidates = async ({
  householdId,
  ledgerId,
}: {
  householdId: string;
  ledgerId: string;
}): Promise<Array<{
  transactionId: string;
  date: string;
  amount: number;
  note: string | null;
  merchant: string | null;
  categoryId: string | null;
  importedBankTransactionId: string | null;
  receiptAttachmentId: string | null;
  sourceType: "manual" | "ocr" | "bank" | null;
}>> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("transactions")
    .select("id,transaction_date,amount,note,merchant,category_id,imported_bank_transaction_id,source_type,source_reference_id")
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .order("transaction_date", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(`取引候補の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as TransactionMatchRow[]).map((row) => ({
    transactionId: row.id,
    date: row.transaction_date,
    amount: row.amount,
    note: row.note,
    merchant: row.merchant,
    categoryId: row.category_id,
    importedBankTransactionId: row.imported_bank_transaction_id,
    receiptAttachmentId: row.source_type === "ocr" ? row.source_reference_id : null,
    sourceType: row.source_type,
  }));
};
