"use server";

import { revalidatePath } from "next/cache";
import { CategorySplitPreset, PresetStatus } from "@/types/domain";
import { archivePreset, createPreset, duplicatePreset, updatePreset, updatePresetPriority, updatePresetStatus } from "@/lib/preset-service";

export const savePresetAction = async (preset: CategorySplitPreset) => {
  const saved = await updatePreset(preset.id, preset).catch(async () => createPreset(preset));
  revalidatePath("/admin/presets");
  revalidatePath("/transactions/new");
  return saved;
};

export const duplicatePresetAction = async (id: string) => {
  const duplicated = await duplicatePreset(id);
  revalidatePath("/admin/presets");
  return duplicated;
};

export const archivePresetAction = async (id: string) => {
  await archivePreset(id);
  revalidatePath("/admin/presets");
  revalidatePath("/transactions/new");
};

export const updatePresetStatusAction = async (id: string, status: PresetStatus) => {
  await updatePresetStatus(id, status);
  revalidatePath("/admin/presets");
  revalidatePath("/transactions/new");
};

export const updatePresetPriorityAction = async (id: string, priority: number) => {
  await updatePresetPriority(id, priority);
  revalidatePath("/admin/presets");
};
