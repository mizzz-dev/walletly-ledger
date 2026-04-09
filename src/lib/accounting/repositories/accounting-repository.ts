import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { AccountMaster, Journal } from "@/types/domain";

interface JournalRow {
  id: string;
  household_id: string;
  ledger_id: string;
  source_type: Journal["sourceType"];
  source_reference_id: string | null;
  journal_date: string;
  description: string;
  status: Journal["status"];
  created_by: string;
  created_at: string;
  updated_at: string;
  journal_lines: Array<{
    id: string;
    journal_id: string;
    line_no: number;
    account_id: string;
    dc: "debit" | "credit";
    amount: number;
    tax_code: string | null;
    memo: string | null;
    account_masters: { code: string; name: string } | null;
  }> | null;
}

export const listAccountsByLedger = async ({ householdId, ledgerId }: { householdId: string; ledgerId: string }): Promise<AccountMaster[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("account_masters")
    .select("id,household_id,ledger_id,code,name,category,is_active,sort_order")
    .eq("household_id", householdId)
    .or(`ledger_id.eq.${ledgerId},ledger_id.is.null`)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("code", { ascending: true });

  if (error) {
    throw new Error(`勘定科目の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    householdId: row.household_id,
    ledgerId: row.ledger_id,
    code: row.code,
    name: row.name,
    category: row.category,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
};

export const listJournalsByLedger = async ({ householdId, ledgerId }: { householdId: string; ledgerId: string }): Promise<Journal[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("journals")
    .select(
      "id,household_id,ledger_id,source_type,source_reference_id,journal_date,description,status,created_by,created_at,updated_at,journal_lines(id,journal_id,line_no,account_id,dc,amount,tax_code,memo,account_masters(code,name))",
    )
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .order("journal_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(`仕訳一覧の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as JournalRow[]).map((row) => ({
    id: row.id,
    householdId: row.household_id,
    ledgerId: row.ledger_id,
    sourceType: row.source_type,
    sourceReferenceId: row.source_reference_id,
    journalDate: row.journal_date,
    description: row.description,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lines: (row.journal_lines ?? []).map((line) => ({
      id: line.id,
      journalId: line.journal_id,
      lineNo: line.line_no,
      accountId: line.account_id,
      accountCode: line.account_masters?.code ?? "",
      accountName: line.account_masters?.name ?? "不明科目",
      dc: line.dc,
      amount: line.amount,
      taxCode: line.tax_code,
      memo: line.memo,
    })),
  }));
};

export const createJournalWithLines = async ({
  journal,
  lines,
}: {
  journal: {
    household_id: string;
    ledger_id: string;
    source_type: Journal["sourceType"];
    source_reference_id: string | null;
    journal_date: string;
    description: string;
    status: Journal["status"];
    created_by: string;
  };
  lines: Array<{
    line_no: number;
    account_id: string;
    dc: "debit" | "credit";
    amount: number;
    tax_code: string | null;
    memo: string | null;
  }>;
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data: insertedJournal, error: journalError } = await supabase.from("journals").insert(journal).select("id").single();

  if (journalError) {
    throw new Error(`仕訳の保存に失敗しました: ${journalError.message}`);
  }

  const linePayload = lines.map((line) => ({ ...line, journal_id: insertedJournal.id }));
  const { error: lineError } = await supabase.from("journal_lines").insert(linePayload);

  if (lineError) {
    await supabase.from("journals").delete().eq("id", insertedJournal.id);
    throw new Error(`仕訳明細の保存に失敗しました: ${lineError.message}`);
  }

  return insertedJournal.id;
};

export const listTransactionsForJournalDraft = async ({
  householdId,
  ledgerId,
}: {
  householdId: string;
  ledgerId: string;
}): Promise<
  Array<{
    id: string;
    amount: number;
    transactionDate: string;
    merchant: string | null;
    note: string | null;
    categoryName: string | null;
    sourceType: "manual" | "ocr" | "bank" | null;
  }>
> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("transactions")
    .select("id,amount,transaction_date,merchant,note,source_type,categories(name)")
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .order("transaction_date", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(`仕訳候補となる取引の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    amount: Number(row.amount),
    transactionDate: row.transaction_date,
    merchant: row.merchant,
    note: row.note,
    categoryName: (row.categories as { name: string } | null)?.name ?? null,
    sourceType: row.source_type,
  }));
};
