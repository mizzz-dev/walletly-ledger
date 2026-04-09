import { describe, expect, it } from "vitest";
import { matchTransactionDraft } from "@/lib/banking/transaction-match";
import { TransactionDraft } from "@/types/domain";

const baseDraft: TransactionDraft = {
  sourceType: "bank",
  householdId: "house-1",
  ledgerId: "ledger-1",
  amount: 1800,
  date: "2026-04-09",
  merchant: "サンプルストア",
  note: "日用品",
  suggestedCategoryId: null,
  suggestedPresetId: null,
  suggestedMemberIds: null,
  bankTransactionId: "bank-1",
  receiptAttachmentId: null,
  confidence: 0.8,
  warnings: [],
};

describe("banking transaction match", () => {
  it("同じbank_transaction_idがあれば exact", () => {
    const result = matchTransactionDraft({
      draft: baseDraft,
      candidates: [{
        transactionId: "tx-1",
        amount: 1800,
        date: "2026-04-09",
        merchant: "別名",
        note: null,
        importedBankTransactionId: "bank-1",
        receiptAttachmentId: null,
        sourceType: "bank",
      }],
    });

    expect(result.level).toBe("exact");
  });

  it("近い日付と金額一致で probable", () => {
    const result = matchTransactionDraft({
      draft: baseDraft,
      candidates: [{
        transactionId: "tx-2",
        amount: 1800,
        date: "2026-04-11",
        merchant: "サンプルストア池袋",
        note: "日用品まとめ買い",
        importedBankTransactionId: null,
        receiptAttachmentId: "receipt-1",
        sourceType: "ocr",
      }],
    });

    expect(result.level).toBe("probable");
  });

  it("類似だが条件不足なら none", () => {
    const result = matchTransactionDraft({
      draft: baseDraft,
      candidates: [{
        transactionId: "tx-3",
        amount: 1900,
        date: "2026-04-20",
        merchant: "全く別店舗",
        note: "別用途",
        importedBankTransactionId: null,
        receiptAttachmentId: null,
        sourceType: "manual",
      }],
    });

    expect(result.level).toBe("none");
  });
});
