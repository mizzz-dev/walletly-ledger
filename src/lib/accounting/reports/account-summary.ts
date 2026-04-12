import { AccountSummaryRow } from "@/types/domain";
import { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";

export const buildAccountSummary = (records: JournalLineReportRecord[]): AccountSummaryRow[] => {
  const summaryMap = new Map<string, AccountSummaryRow>();

  for (const record of records) {
    const key = `${record.accountCode}:${record.accountName}`;
    const current =
      summaryMap.get(key) ??
      {
        accountCode: record.accountCode,
        accountName: record.accountName,
        accountCategory: record.accountCategory,
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
      };

    if (record.dc === "debit") {
      current.totalDebit += record.amount;
    } else {
      current.totalCredit += record.amount;
    }

    current.balance = current.totalDebit - current.totalCredit;
    summaryMap.set(key, current);
  }

  return [...summaryMap.values()].sort((a, b) => a.accountCode.localeCompare(b.accountCode));
};
