import { describe, expect, it } from "vitest";
import { buildJournalExportRows, toGenericJournalCsv } from "@/lib/accounting/export/journal-csv";
import type { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";

const baseRecords: JournalLineReportRecord[] = [
  {
    journalId: "j1",
    journalDate: "2026-04-01",
    description: "交通費",
    sourceType: "transaction",
    sourceReferenceId: "tx1",
    lineId: "l1",
    lineNo: 1,
    accountId: "a1",
    accountCode: "621",
    accountName: "旅費交通費",
    accountCategory: "expense",
    dc: "debit",
    amount: 1500,
    taxCode: "INPUT_10",
    memo: "移動",
  },
  {
    journalId: "j1",
    journalDate: "2026-04-01",
    description: "交通費",
    sourceType: "transaction",
    sourceReferenceId: "tx1",
    lineId: "l2",
    lineNo: 2,
    accountId: "a2",
    accountCode: "111",
    accountName: "普通預金",
    accountCategory: "asset",
    dc: "credit",
    amount: 1500,
    taxCode: null,
    memo: null,
  },
];

describe("journal export", () => {
  it("仕訳明細をgeneric CSV行へ変換できる", () => {
    const rows = buildJournalExportRows(baseRecords);

    expect(rows).toHaveLength(2);
    expect(rows[0].debitAccountCode).toBe("621");
    expect(rows[0].creditAccountCode).toBe("111");
  });

  it("CSV文字列を生成できる", () => {
    const rows = buildJournalExportRows(baseRecords);
    const csv = toGenericJournalCsv(rows);

    expect(csv.split("\n")[0]).toContain("journal_date");
    expect(csv).toContain("交通費");
  });

  it("行不整合の仕訳はエラー", () => {
    expect(() =>
      buildJournalExportRows([
        {
          ...baseRecords[0],
        },
      ]),
    ).toThrow("行数が不足");
  });
});
