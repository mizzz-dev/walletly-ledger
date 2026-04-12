import { TrialBalanceRow } from "@/types/domain";
import { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";
import { buildAccountSummary } from "@/lib/accounting/reports/account-summary";

export interface TrialBalanceReport {
  rows: TrialBalanceRow[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export const buildTrialBalance = (records: JournalLineReportRecord[]): TrialBalanceReport => {
  const rows: TrialBalanceRow[] = buildAccountSummary(records).map((row) => ({
    accountCode: row.accountCode,
    accountName: row.accountName,
    accountCategory: row.accountCategory,
    debit: row.totalDebit,
    credit: row.totalCredit,
    diff: row.balance,
  }));

  const totalDebit = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredit = rows.reduce((sum, row) => sum + row.credit, 0);

  return {
    rows,
    totalDebit,
    totalCredit,
    isBalanced: totalDebit === totalCredit,
  };
};
