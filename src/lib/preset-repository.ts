import { CategorySplitPreset, PresetStatus } from "@/types/domain";
import { createMockPresetRepository } from "@/lib/preset-repository/mock";
import { createSupabasePresetRepository } from "@/lib/preset-repository/supabase";

export interface PresetRepository {
  listCategorySplitPresets(params?: { householdId?: string; ledgerId?: string | null; statuses?: PresetStatus[] }): Promise<CategorySplitPreset[]>;
  getCategorySplitPresetById(id: string): Promise<CategorySplitPreset | null>;
  createCategorySplitPreset(input: { householdId: string; ledgerId?: string | null; createdBy: string; preset: CategorySplitPreset; isDefault?: boolean }): Promise<CategorySplitPreset>;
  updateCategorySplitPreset(input: { id: string; preset: CategorySplitPreset }): Promise<CategorySplitPreset>;
  duplicateCategorySplitPreset(input: { id: string; createdBy: string }): Promise<CategorySplitPreset>;
  archiveCategorySplitPreset(id: string): Promise<void>;
  updateCategorySplitPresetStatus(input: { id: string; status: PresetStatus }): Promise<void>;
  updateCategorySplitPresetPriority(input: { id: string; priority: number }): Promise<void>;
}

export const createPresetRepository = (driver: "mock" | "supabase" = process.env.NEXT_PUBLIC_USE_MOCK_PRESET === "true" ? "mock" : "supabase"): PresetRepository => {
  if (driver === "mock") {
    return createMockPresetRepository();
  }

  return createSupabasePresetRepository();
};

export { createMockPresetRepository, createSupabasePresetRepository };
