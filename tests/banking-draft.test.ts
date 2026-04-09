import { describe, expect, it } from "vitest";
import { createTransactionDraftFromBankTransaction, normalizeMerchantFromBankTransaction } from "@/lib/banking/draft";

describe("banking draft", () => {
  it("銀行明細から共通draftを生成できる", () => {
    const draft = createTransactionDraftFromBankTransaction({
      householdId: "house-1",
      ledgerId: "ledger-1",
      bankTransaction: {
        id: "bank-1",
        postedAt: "2026-04-09",
        amount: 1200,
        description: "コンビニ お茶",
        counterparty: "テストコンビニ",
        direction: "outflow",
      },
    });

    expect(draft.sourceType).toBe("bank");
    expect(draft.bankTransactionId).toBe("bank-1");
    expect(draft.merchant).toBe("テストコンビニ");
  });

  it("入金明細は警告つきで生成される", () => {
    const draft = createTransactionDraftFromBankTransaction({
      householdId: "house-1",
      ledgerId: "ledger-1",
      bankTransaction: {
        id: "bank-2",
        postedAt: "2026-04-09",
        amount: 2000,
        description: "給与",
        counterparty: null,
        direction: "inflow",
      },
    });

    expect(draft.warnings[0]).toContain("支出以外");
  });

  it("counterpartyがない場合でもmerchant候補を正規化できる", () => {
    expect(normalizeMerchantFromBankTransaction({ counterparty: null, description: "【VISA】 SAMPLE STORE / TOKYO" })).toBe("VISA SAMPLE STORE");
  });

  it("金額不正はwarningで返す", () => {
    const draft = createTransactionDraftFromBankTransaction({
      householdId: "house-1",
      ledgerId: "ledger-1",
      bankTransaction: {
        id: "bank-3",
        postedAt: "2026-04-09",
        amount: 0,
        description: "不正金額",
        counterparty: null,
        direction: "outflow",
      },
    });

    expect(draft.amount).toBeNull();
    expect(draft.warnings.some((item) => item.includes("金額"))).toBe(true);
  });
});
