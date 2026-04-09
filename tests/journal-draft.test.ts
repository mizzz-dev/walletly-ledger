import { describe, expect, it } from "vitest";
import { createJournalDraftFromTransaction, createJournalDraftFromTransactionDraft } from "@/lib/accounting/journal-draft";

describe("journal draft", () => {
  const accounts = [
    { id: "acc-exp", householdId: "hh1", ledgerId: "ld1", code: "621", name: "旅費交通費", category: "expense", isActive: true, sortOrder: 1 },
    { id: "acc-bank", householdId: "hh1", ledgerId: "ld1", code: "111", name: "普通預金", category: "asset", isActive: true, sortOrder: 2 },
  ] as const;

  it("transactionからwork向け仕訳下書きを生成できる", () => {
    const draft = createJournalDraftFromTransaction({
      householdId: "hh1",
      ledgerId: "ld1",
      ledgerType: "work",
      transactionId: "tx1",
      amount: 3500,
      transactionDate: "2026-04-09",
      merchant: "JR",
      note: "移動",
      categoryName: "交通費",
      sourceType: "bank",
      accounts: [...accounts],
    });

    expect(draft.sourceReferenceId).toBe("tx1");
    expect(draft.lines[0].dc).toBe("debit");
    expect(draft.lines[1].dc).toBe("credit");
    expect(draft.warnings).toHaveLength(0);
  });

  it("work以外のledgerはエラー", () => {
    expect(() =>
      createJournalDraftFromTransaction({
        householdId: "hh1",
        ledgerId: "ld1",
        ledgerType: "family",
        transactionId: "tx1",
        amount: 3500,
        transactionDate: "2026-04-09",
        merchant: null,
        note: null,
        categoryName: null,
        sourceType: "manual",
        accounts: [...accounts],
      }),
    ).toThrow("work台帳以外");
  });

  it("account未設定時はwarningを返す", () => {
    const draft = createJournalDraftFromTransactionDraft({
      ledgerType: "work",
      accounts: [],
      draft: {
        sourceType: "ocr",
        householdId: "hh1",
        ledgerId: "ld1",
        amount: 1000,
        date: "2026-04-09",
        merchant: "コンビニ",
        note: null,
        suggestedCategoryId: null,
        suggestedPresetId: null,
        suggestedMemberIds: null,
        bankTransactionId: null,
        receiptAttachmentId: "rc1",
        confidence: 0.5,
        warnings: [],
      },
    });

    expect(draft.warnings.some((warning) => warning.includes("未設定"))).toBe(true);
  });
});
