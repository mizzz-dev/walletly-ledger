import { describe, expect, it } from "vitest";
import { toCategorySplitPreset, toPresetInsertPayload } from "@/lib/preset-repository/supabase";
import { CategorySplitPreset } from "@/types/domain";

const basePreset: CategorySplitPreset = {
  id: "preset-1",
  name: "テスト",
  status: "published",
  priority: 100,
  targetCategoryIds: ["food"],
  splitMethod: "ratio",
  roundingMode: "round",
  conditions: { minAmount: 1000 },
  members: [
    { memberId: "m1", ratio: 0.6, weight: 2, fixedAmount: 200 },
    { memberId: "m2", ratio: 0.4, weight: 1, fixedAmount: 100 },
  ],
  updatedAt: "2026-04-04T00:00:00Z",
};

describe("supabase preset mapping", () => {
  it("insert payloadへ整形できる", () => {
    const payload = toPresetInsertPayload({
      householdId: "household-1",
      createdBy: "user-1",
      preset: basePreset,
    });

    expect(payload.mode).toBe("ratio");
    expect(payload.category_ids).toEqual(["food"]);
    expect(payload.ratio).toEqual([0.6, 0.4]);
    expect(payload.weights).toEqual([2, 1]);
    expect(payload.fixed_amounts).toEqual([200, 100]);
    expect(payload.status).toBe("published");
  });

  it("rowからドメイン型へ戻せる", () => {
    const domain = toCategorySplitPreset({
      id: "preset-1",
      household_id: "household-1",
      ledger_id: null,
      name: "テスト",
      category_ids: ["food"],
      mode: "ratio",
      ratio: [0.6, 0.4],
      weights: [2, 1],
      fixed_amounts: [200, 100],
      rounding: "round",
      conditions: { minAmount: 1000 },
      priority: 100,
      is_default: false,
      status: "published",
      created_by: "user-1",
      created_at: "2026-04-04T00:00:00Z",
      updated_at: "2026-04-04T00:00:00Z",
      member_ids: ["m1", "m2"],
    });

    expect(domain.members[0]?.memberId).toBe("m1");
    expect(domain.members[0]?.ratio).toBe(0.6);
    expect(domain.status).toBe("published");
  });

  it("複製時の期待値（名前・状態）", () => {
    const duplicated: CategorySplitPreset = {
      ...basePreset,
      id: "preset-2",
      name: `${basePreset.name}（複製）`,
      status: "draft",
    };

    expect(duplicated.name).toContain("複製");
    expect(duplicated.status).toBe("draft");
  });
});
