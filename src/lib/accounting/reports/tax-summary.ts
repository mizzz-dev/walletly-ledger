import { resolveTaxCodeLabel } from "@/lib/accounting/tax-mapping";
import { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";
import { TaxSummaryRow } from "@/types/domain";

export const UNSPECIFIED_TAX_CODE = "UNSPECIFIED";

export const buildTaxSummary = (records: JournalLineReportRecord[]): TaxSummaryRow[] => {
  const summaryMap = new Map<string, TaxSummaryRow>();

  for (const record of records) {
    const taxCode = record.taxCode ?? UNSPECIFIED_TAX_CODE;
    const current =
      summaryMap.get(taxCode) ?? {
        taxCode,
        taxLabel: taxCode === UNSPECIFIED_TAX_CODE ? "未設定" : resolveTaxCodeLabel(taxCode),
        totalAmount: 0,
        lineCount: 0,
      };

    current.totalAmount += record.amount;
    current.lineCount += 1;
    summaryMap.set(taxCode, current);
  }

  return [...summaryMap.values()].sort((a, b) => a.taxCode.localeCompare(b.taxCode));
};
