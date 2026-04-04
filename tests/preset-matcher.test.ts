import { describe, expect, it } from "vitest";
import { findApplicablePreset } from "@/lib/preset-matcher";
import { CategorySplitPreset } from "@/types/domain";

const basePreset: CategorySplitPreset = {
  id: "a",
  name: "base",
  status: "published",
  priority: 10,
  targetCategoryIds: ["food"],
  splitMethod: "equal",
  roundingMode: "round",
  members: [{ memberId: "m1" }, { memberId: "m2" }],
  updatedAt: "2026-04-01T00:00:00Z",
};

describe("findApplicablePreset", () => {
  it("優先度順で選ばれる", () => {
    const result = findApplicablePreset([
      { ...basePreset, id: "low", priority: 10 },
      { ...basePreset, id: "high", priority: 100 },
    ], { categoryId: "food", amount: 2000, transactionDate: "2026-04-04" });

    expect(result?.id).toBe("high");
  });

  it("draft / archivedは除外", () => {
    const result = findApplicablePreset([
      { ...basePreset, id: "draft", status: "draft", priority: 200 },
      { ...basePreset, id: "archived", status: "archived", priority: 150 },
      { ...basePreset, id: "published", status: "published", priority: 100 },
    ], { categoryId: "food", amount: 2000, transactionDate: "2026-04-04" });

    expect(result?.id).toBe("published");
  });

  it("条件一致のみ選ばれる", () => {
    const result = findApplicablePreset([
      { ...basePreset, id: "cond-a", conditions: { minAmount: 3000 } },
      { ...basePreset, id: "cond-b", conditions: { minAmount: 1000, keywords: ["スーパー"], weekdays: [6], merchantName: "AEON" } },
    ], {
      categoryId: "food",
      amount: 1500,
      note: "スーパーで買い物",
      merchantName: "AEON",
      transactionDate: "2026-04-04",
    });

    expect(result?.id).toBe("cond-b");
  });
});
