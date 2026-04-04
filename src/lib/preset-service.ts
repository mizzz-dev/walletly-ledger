import { createPresetRepository } from "@/lib/preset-repository";
import { CategorySplitPreset, PresetStatus } from "@/types/domain";

const defaultHouseholdId = process.env.NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID ?? "00000000-0000-0000-0000-000000000001";
const defaultUserId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "00000000-0000-0000-0000-000000000001";

export const listAdminPresets = async () => {
  const repository = createPresetRepository();
  return repository.listCategorySplitPresets({ householdId: defaultHouseholdId });
};

export const listPublishedPresets = async () => {
  const repository = createPresetRepository();
  return repository.listCategorySplitPresets({ householdId: defaultHouseholdId, statuses: ["published"] });
};

export const createPreset = async (preset: CategorySplitPreset) => {
  const repository = createPresetRepository();
  return repository.createCategorySplitPreset({
    householdId: defaultHouseholdId,
    createdBy: defaultUserId,
    preset,
  });
};

export const updatePreset = async (id: string, preset: CategorySplitPreset) => {
  const repository = createPresetRepository();
  return repository.updateCategorySplitPreset({ id, preset });
};

export const duplicatePreset = async (id: string) => {
  const repository = createPresetRepository();
  return repository.duplicateCategorySplitPreset({ id, createdBy: defaultUserId });
};

export const archivePreset = async (id: string) => {
  const repository = createPresetRepository();
  return repository.archiveCategorySplitPreset(id);
};

export const updatePresetStatus = async (id: string, status: PresetStatus) => {
  const repository = createPresetRepository();
  return repository.updateCategorySplitPresetStatus({ id, status });
};

export const updatePresetPriority = async (id: string, priority: number) => {
  const repository = createPresetRepository();
  return repository.updateCategorySplitPresetPriority({ id, priority });
};
