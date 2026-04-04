import { CategorySplitPreset, PresetStatus } from "@/types/domain";
import type { PresetRepository } from "@/lib/preset-repository";

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
    members: [{ memberId: "m1" }, { memberId: "m2" }, { memberId: "m3" }],
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

let memoryStore = [...mockPresets];

const filterByStatus = (rows: CategorySplitPreset[], statuses?: PresetStatus[]) => {
  if (!statuses || statuses.length === 0) return rows;
  return rows.filter((row) => statuses.includes(row.status));
};

export const createMockPresetRepository = (): PresetRepository => ({
  async listCategorySplitPresets(params) {
    return filterByStatus(memoryStore, params?.statuses);
  },
  async getCategorySplitPresetById(id) {
    return memoryStore.find((row) => row.id === id) ?? null;
  },
  async createCategorySplitPreset(input) {
    memoryStore = [{ ...input.preset, updatedAt: new Date().toISOString() }, ...memoryStore];
    return memoryStore[0];
  },
  async updateCategorySplitPreset(input) {
    memoryStore = memoryStore.map((row) => (row.id === input.id ? { ...input.preset, updatedAt: new Date().toISOString() } : row));
    return memoryStore.find((row) => row.id === input.id) ?? input.preset;
  },
  async duplicateCategorySplitPreset(input) {
    const source = memoryStore.find((row) => row.id === input.id);
    if (!source) throw new Error("複製対象のプリセットが見つかりません");
    const duplicated: CategorySplitPreset = {
      ...source,
      id: `preset-${crypto.randomUUID()}`,
      name: `${source.name}（複製）`,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    memoryStore = [duplicated, ...memoryStore];
    return duplicated;
  },
  async archiveCategorySplitPreset(id) {
    memoryStore = memoryStore.map((row) => (row.id === id ? { ...row, status: "archived", updatedAt: new Date().toISOString() } : row));
  },
  async updateCategorySplitPresetStatus(input) {
    memoryStore = memoryStore.map((row) => (row.id === input.id ? { ...row, status: input.status, updatedAt: new Date().toISOString() } : row));
  },
  async updateCategorySplitPresetPriority(input) {
    memoryStore = memoryStore.map((row) => (row.id === input.id ? { ...row, priority: input.priority, updatedAt: new Date().toISOString() } : row));
  },
});
