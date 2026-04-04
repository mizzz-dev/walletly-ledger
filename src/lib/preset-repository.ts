import { CategorySplitPreset } from "@/types/domain";

export interface PresetRepository {
  listCategorySplitPresets(): Promise<CategorySplitPreset[]>;
}

const mockPresets: CategorySplitPreset[] = [
  {
    id: "preset-grocery",
    name: "食費ベーシック",
    status: "published",
    priority: 120,
    targetCategoryIds: ["food", "daily"],
    splitMethod: "equal",
    roundingMode: "round",
    conditions: { minAmount: 1000, keywords: ["スーパー", "まとめ買い"] },
    members: [
      { memberId: "m1" },
      { memberId: "m2" },
      { memberId: "m3" },
    ],
    updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "preset-transport-weekday",
    name: "平日交通",
    status: "published",
    priority: 95,
    targetCategoryIds: ["transport"],
    splitMethod: "ratio",
    roundingMode: "floor",
    conditions: { weekdays: [1, 2, 3, 4, 5], merchantName: "JR" },
    members: [
      { memberId: "m1", ratio: 0.5 },
      { memberId: "m2", ratio: 0.3 },
      { memberId: "m3", ratio: 0.2 },
    ],
    updatedAt: "2026-04-01T09:00:00Z",
  },
  {
    id: "preset-travel",
    name: "旅行混合",
    status: "draft",
    priority: 60,
    targetCategoryIds: ["travel"],
    splitMethod: "mixed_fixed",
    roundingMode: "ceil",
    conditions: { minAmount: 5000 },
    members: [
      { memberId: "m1", fixedAmount: 1500 },
      { memberId: "m2" },
      { memberId: "m3" },
    ],
    updatedAt: "2026-03-31T09:00:00Z",
  },
];

export const createMockPresetRepository = (): PresetRepository => ({
  async listCategorySplitPresets() {
    return mockPresets;
  },
});
