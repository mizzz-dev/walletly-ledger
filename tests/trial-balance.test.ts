import { describe, expect, it } from "vitest";
import { buildTrialBalance } from "@/lib/accounting/reports/trial-balance";
import { assertWorkLedger } from "@/lib/accounting/reports/scope";
import type { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";

const balancedRecords: JournalLineReportRecord[] = [
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
    taxCode: null,
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
];

describe("trial balance", () => {
  it("貸借一致を判定できる", () => {
    const report = buildTrialBalance(balancedRecords);
    expect(report.totalDebit).toBe(1000);
    expect(report.totalCredit).toBe(1000);
    expect(report.isBalanced).toBe(true);
  });

  it("貸借不一致を判定できる", () => {
    const report = buildTrialBalance([
      ...balancedRecords,
      {
        ...balancedRecords[0],
        journalId: "j2",
        lineId: "l3",
        amount: 100,
      },
    ]);
    expect(report.isBalanced).toBe(false);
  });

  it("work以外のledgerをガードする", () => {
    expect(() => assertWorkLedger("family")).toThrow("work台帳以外");
  });
});
