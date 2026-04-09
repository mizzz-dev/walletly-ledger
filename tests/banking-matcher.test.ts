import { describe, expect, it } from "vitest";
import { enrichBankDraftForReview } from "@/lib/banking/matcher";
import { CategorySplitPreset, TransactionDraft } from "@/types/domain";

const draft: TransactionDraft = {
  sourceType: "bank",
  householdId: "house-1",
  ledgerId: "ledger-1",
  amount: 2400,
  date: "2026-04-09",
  merchant: "テストコンビニ",
  note: "コンビニで買い物",
  suggestedCategoryId: null,
  suggestedPresetId: null,
  suggestedMemberIds: null,
  bankTransactionId: "bank-1",
  receiptAttachmentId: null,
  confidence: null,
  warnings: [],
};

const preset: CategorySplitPreset = {
  id: "preset-1",
  name: "食費折半",
  status: "published",
  priority: 100,
  targetCategoryIds: ["food"],
  splitMethod: "equal",
  roundingMode: "round",
  members: [{ memberId: "m1" }, { memberId: "m2" }],
  updatedAt: "2026-04-09T00:00:00Z",
};

describe("banking matcher", () => {
  it("カテゴリ推定後にプリセット適用とsplit previewを返す", () => {
    const item = enrichBankDraftForReview({
      bankTransactionId: "bank-1",
      accountDisplayName: "テスト口座",
      direction: "outflow",
      matchStatus: "pending",
      draft,
      categories: [{ id: "food", name: "食費", color: "#fff", ledgerId: "ledger-1" }],
      presets: [preset],
      memberIds: ["m1", "m2"],
      history: [],
      transactions: [],
    });

    expect(item.categorySuggestion.categoryId).toBe("food");
    expect(item.presetId).toBe("preset-1");
    expect(item.splitPreview).toHaveLength(2);
  });
});
