import { describe, expect, it } from "vitest";
import { DEFAULT_BANK_CATEGORY_RULES } from "@/lib/banking/category-rules";
import { suggestCategoryFromDraft } from "@/lib/banking/category-matcher";
import { TransactionDraft } from "@/types/domain";

const categories = [
  { id: "food", name: "食費", color: "#fff", ledgerId: "ledger-1" },
  { id: "transport", name: "交通費", color: "#fff", ledgerId: "ledger-1" },
  { id: "utilities", name: "水道光熱費", color: "#fff", ledgerId: "ledger-1" },
];

const baseDraft: TransactionDraft = {
  sourceType: "bank",
  householdId: "house-1",
  ledgerId: "ledger-1",
  amount: 1200,
  date: "2026-04-09",
  merchant: "",
  note: "",
  suggestedCategoryId: null,
  suggestedPresetId: null,
  suggestedMemberIds: null,
  bankTransactionId: "bank-1",
  receiptAttachmentId: null,
  confidence: null,
  warnings: [],
};

describe("banking category matcher", () => {
  it("ルールマッチを最優先で返す", () => {
    const result = suggestCategoryFromDraft({
      draft: { ...baseDraft, merchant: "テストコンビニ", note: "コンビニで購入" },
      categories,
      rules: DEFAULT_BANK_CATEGORY_RULES,
      history: [],
    });

    expect(result.reason).toBe("rule");
    expect(result.categoryId).toBe("food");
  });

  it("履歴マッチを返せる", () => {
    const result = suggestCategoryFromDraft({
      draft: { ...baseDraft, merchant: "サンプル電力", note: "4月分" },
      categories,
      rules: [],
      history: [{ merchant: "サンプル電力", note: "3月分", categoryId: "utilities" }],
    });

    expect(result.reason).toBe("history");
    expect(result.categoryId).toBe("utilities");
  });

  it("候補がない場合でも処理継続する", () => {
    const result = suggestCategoryFromDraft({
      draft: { ...baseDraft, merchant: null, note: null },
      categories,
      rules: [],
      history: [],
    });

    expect(result.reason).toBe("none");
    expect(result.categoryId).toBeNull();
  });
});
