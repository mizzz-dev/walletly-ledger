import { describe, expect, it } from "vitest";
import { buildAccountSummary } from "@/lib/accounting/reports/account-summary";
import type { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";

const records: JournalLineReportRecord[] = [
  {
    journalId: "j1",
    journalDate: "2026-04-01",
    description: "売上",
    sourceType: "manual",
    sourceReferenceId: null,
    lineId: "l1",
    lineNo: 1,
    accountId: "a1",
    accountCode: "111",
    accountName: "普通預金",
    accountCategory: "asset",
    dc: "debit",
    amount: 1000,
    taxCode: "OUT_OF_SCOPE",
    memo: null,
  },
  {
    journalId: "j1",
    journalDate: "2026-04-01",
    description: "売上",
    sourceType: "manual",
    sourceReferenceId: null,
    lineId: "l2",
    lineNo: 2,
    accountId: "a2",
    accountCode: "701",
    accountName: "売上高",
    accountCategory: "revenue",
    dc: "credit",
    amount: 1000,
    taxCode: "TAXABLE_10",
    memo: null,
  },
  {
    journalId: "j2",
    journalDate: "2026-04-02",
    description: "振込手数料",
    sourceType: "bank",
    sourceReferenceId: "bk1",
    lineId: "l3",
    lineNo: 1,
    accountId: "a3",
    accountCode: "631",
    accountName: "通信費",
    accountCategory: "expense",
    dc: "debit",
    amount: 200,
    taxCode: null,
    memo: null,
  },
];

describe("account summary", () => {
  it("科目別の借方・貸方・差引を計算できる", () => {
    const rows = buildAccountSummary(records);

    const cash = rows.find((row) => row.accountCode === "111");
    expect(cash?.totalDebit).toBe(1000);
    expect(cash?.totalCredit).toBe(0);

    const revenue = rows.find((row) => row.accountCode === "701");
    expect(revenue?.totalCredit).toBe(1000);
    expect(revenue?.balance).toBe(-1000);
  });

  it("空データは空配列", () => {
    expect(buildAccountSummary([])).toEqual([]);
  });
});
