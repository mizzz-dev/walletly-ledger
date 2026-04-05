import { createPresetRepository } from "@/lib/preset-repository";
import { CategorySplitPreset, PresetStatus } from "@/types/domain";

interface PresetScope {
  householdId: string;
  ledgerId?: string | null;
  userId?: string;
}

export const listAdminPresets = async (scope: PresetScope) => {
  const repository = createPresetRepository();
  return repository.listCategorySplitPresets({ householdId: scope.householdId, ledgerId: scope.ledgerId ?? null });
};

export const listPublishedPresets = async (scope: PresetScope) => {
  const repository = createPresetRepository();
  return repository.listCategorySplitPresets({
    householdId: scope.householdId,
    ledgerId: scope.ledgerId ?? null,
    statuses: ["published"],
  });
};

export const createPreset = async (scope: PresetScope, preset: CategorySplitPreset) => {
  if (!scope.userId) {
    throw new Error("ユーザーIDが取得できないためプリセットを作成できません。");
  }

  const repository = createPresetRepository();
  return repository.createCategorySplitPreset({
    householdId: scope.householdId,
    ledgerId: scope.ledgerId ?? null,
    createdBy: scope.userId,
    preset,
  });
};

export const updatePreset = async (id: string, preset: CategorySplitPreset) => {
  const repository = createPresetRepository();
  return repository.updateCategorySplitPreset({ id, preset });
};

export const duplicatePreset = async ({ userId }: { userId?: string }, id: string) => {
  if (!userId) {
    throw new Error("ユーザーIDが取得できないためプリセットを複製できません。");
  }

  const repository = createPresetRepository();
  return repository.duplicateCategorySplitPreset({ id, createdBy: userId });
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
