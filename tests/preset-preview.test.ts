import { describe, expect, it } from "vitest";
import { previewPresetSplit } from "@/lib/preset-preview";
import { CategorySplitPreset } from "@/types/domain";

const memberIds = ["m1", "m2", "m3"];

const basePreset: Omit<CategorySplitPreset, "splitMethod" | "members"> = {
  id: "x",
  name: "test",
  status: "published",
  priority: 10,
  targetCategoryIds: ["food"],
  roundingMode: "round",
  updatedAt: "2026-04-01T00:00:00Z",
};

describe("previewPresetSplit", () => {
  it("equal", () => {
    const result = previewPresetSplit({
      amount: 900,
      memberIds,
      preset: { ...basePreset, splitMethod: "equal", members: memberIds.map((id) => ({ memberId: id })) },
    });
    expect(result.map((r) => r.amount)).toEqual([300, 300, 300]);
  });

  it("ratio", () => {
    const result = previewPresetSplit({
      amount: 1000,
      memberIds,
      preset: { ...basePreset, splitMethod: "ratio", members: [{ memberId: "m1", ratio: 0.5 }, { memberId: "m2", ratio: 0.3 }, { memberId: "m3", ratio: 0.2 }] },
    });
    expect(result.map((r) => r.amount)).toEqual([500, 300, 200]);
  });

  it("weight", () => {
    const result = previewPresetSplit({
      amount: 1200,
      memberIds,
      preset: { ...basePreset, splitMethod: "weight", members: [{ memberId: "m1", weight: 3 }, { memberId: "m2", weight: 2 }, { memberId: "m3", weight: 1 }] },
    });
    expect(result.map((r) => r.amount)).toEqual([600, 400, 200]);
  });

  it("mixed_fixed", () => {
    const result = previewPresetSplit({
      amount: 2000,
      memberIds,
      preset: { ...basePreset, splitMethod: "mixed_fixed", members: [{ memberId: "m1", fixedAmount: 800 }, { memberId: "m2" }, { memberId: "m3" }] },
    });
    expect(result.map((r) => r.amount)).toEqual([800, 600, 600]);
  });

  it("端数処理", () => {
    const result = previewPresetSplit({
      amount: 100,
      memberIds,
      preset: { ...basePreset, roundingMode: "floor", splitMethod: "ratio", members: [{ memberId: "m1", ratio: 0.3333 }, { memberId: "m2", ratio: 0.3333 }, { memberId: "m3", ratio: 0.3334 }] },
    });
    expect(result.reduce((acc, row) => acc + row.amount, 0)).toBe(100);
  });

  it("不正データは失敗", () => {
    expect(() => previewPresetSplit({
      amount: 1000,
      memberIds,
      preset: { ...basePreset, splitMethod: "mixed_fixed", members: [{ memberId: "m1", fixedAmount: 900 }, { memberId: "m2", fixedAmount: 900 }, { memberId: "m3" }] },
    })).toThrow();
  });
});
