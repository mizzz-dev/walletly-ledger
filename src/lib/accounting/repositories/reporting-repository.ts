import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { AccountCategory, AccountingSourceType, DebitCredit } from "@/types/domain";

export interface JournalLineReportRecord {
  journalId: string;
  journalDate: string;
  description: string;
  sourceType: AccountingSourceType | null;
  sourceReferenceId: string | null;
  lineId: string;
  lineNo: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountCategory: AccountCategory;
  dc: DebitCredit;
  amount: number;
  taxCode: string | null;
  memo: string | null;
}

interface JournalLineReportRow {
  id: string;
  line_no: number;
  account_id: string;
  dc: DebitCredit;
  amount: number;
  tax_code: string | null;
  memo: string | null;
  account_masters: {
    code: string;
    name: string;
    category: AccountCategory;
  } | null;
  journals:
    | {
        id: string;
        journal_date: string;
        description: string;
        source_type: AccountingSourceType | null;
        source_reference_id: string | null;
      }
    | {
        id: string;
        journal_date: string;
        description: string;
        source_type: AccountingSourceType | null;
        source_reference_id: string | null;
      }[]
    | null;
}

export const listJournalLineRecordsByPeriod = async ({
  householdId,
  ledgerId,
  dateFrom,
  dateTo,
}: {
  householdId: string;
  ledgerId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<JournalLineReportRecord[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("journal_lines")
    .select(
      "id,line_no,account_id,dc,amount,tax_code,memo,account_masters(code,name,category),journals!inner(id,journal_date,description,source_type,source_reference_id,household_id,ledger_id)",
    )
    .eq("journals.household_id", householdId)
    .eq("journals.ledger_id", ledgerId)
    .gte("journals.journal_date", dateFrom)
    .lte("journals.journal_date", dateTo)
    .order("line_no", { ascending: true });

  if (error) {
    throw new Error(`会計レポート用仕訳データの取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as JournalLineReportRow[]).flatMap((row) => {
    const journal = Array.isArray(row.journals) ? row.journals[0] : row.journals;
    if (!journal) {
      return [];
    }

    return [
      {
        journalId: journal.id,
        journalDate: journal.journal_date,
        description: journal.description,
        sourceType: journal.source_type,
        sourceReferenceId: journal.source_reference_id,
        lineId: row.id,
        lineNo: row.line_no,
        accountId: row.account_id,
        accountCode: row.account_masters?.code ?? "",
        accountName: row.account_masters?.name ?? "不明科目",
        accountCategory: row.account_masters?.category ?? "expense",
        dc: row.dc,
        amount: Number(row.amount),
        taxCode: row.tax_code,
        memo: row.memo,
      },
    ];
  });
};
