import { describe, expect, it } from "vitest";
import { calculateJournalBalance } from "@/lib/accounting/journal-balance";

describe("journal balance", () => {
  it("貸借一致を判定できる", () => {
    const result = calculateJournalBalance([
      { dc: "debit", amount: 1200 },
      { dc: "credit", amount: 1200 },
    ]);

    expect(result.isBalanced).toBe(true);
  });

  it("貸借不一致を検知できる", () => {
    const result = calculateJournalBalance([
      { dc: "debit", amount: 1200 },
      { dc: "credit", amount: 1000 },
    ]);

    expect(result.isBalanced).toBe(false);
  });
});
