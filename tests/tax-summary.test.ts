import { describe, expect, it } from "vitest";
import { buildTaxSummary, UNSPECIFIED_TAX_CODE } from "@/lib/accounting/reports/tax-summary";
import type { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";

describe("tax summary", () => {
  it("税区分ごとの金額と件数を集計できる", () => {
    const rows = buildTaxSummary([
      {
        journalId: "j1",
        journalDate: "2026-04-01",
        description: "仕入",
        sourceType: "manual",
        sourceReferenceId: null,
        lineId: "l1",
        lineNo: 1,
        accountId: "a1",
        accountCode: "611",
        accountName: "消耗品費",
        accountCategory: "expense",
        dc: "debit",
        amount: 1000,
        taxCode: "INPUT_10",
        memo: null,
      },
      {
        journalId: "j1",
        journalDate: "2026-04-01",
        description: "仕入",
        sourceType: "manual",
        sourceReferenceId: null,
        lineId: "l2",
        lineNo: 2,
        accountId: "a2",
        accountCode: "111",
        accountName: "普通預金",
        accountCategory: "asset",
        dc: "credit",
        amount: 1000,
        taxCode: null,
        memo: null,
      },
      {
        journalId: "j2",
        journalDate: "2026-04-02",
        description: "ゼロ金額",
        sourceType: "manual",
        sourceReferenceId: null,
        lineId: "l3",
        lineNo: 1,
        accountId: "a3",
        accountCode: "611",
        accountName: "消耗品費",
        accountCategory: "expense",
        dc: "debit",
        amount: 0,
        taxCode: "INPUT_10",
        memo: null,
      },
    ]);

    const input10 = rows.find((row) => row.taxCode === "INPUT_10");
    expect(input10?.totalAmount).toBe(1000);
    expect(input10?.lineCount).toBe(2);

    const unspecified = rows.find((row) => row.taxCode === UNSPECIFIED_TAX_CODE);
    expect(unspecified?.taxLabel).toBe("未設定");
    expect(unspecified?.lineCount).toBe(1);
  });

  it("空データは空配列", () => {
    expect(buildTaxSummary([])).toEqual([]);
  });
});
