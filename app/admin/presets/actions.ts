"use server";

import { revalidatePath } from "next/cache";
import { CategorySplitPreset, PresetStatus } from "@/types/domain";
import { archivePreset, createPreset, duplicatePreset, updatePreset, updatePresetPriority, updatePresetStatus } from "@/lib/preset-service";

export const savePresetAction = async ({
  householdId,
  ledgerId,
  userId,
  preset,
}: {
  householdId: string;
  ledgerId: string | null;
  userId: string | null;
  preset: CategorySplitPreset;
}) => {
  const saved = await updatePreset(preset.id, preset).catch(async () => createPreset({ householdId, ledgerId, userId: userId ?? undefined }, preset));
  revalidatePath("/admin/presets");
  revalidatePath("/transactions/new");
  return saved;
};

export const duplicatePresetAction = async ({ id, userId }: { id: string; userId: string | null }) => {
  if (!userId) {
    throw new Error("ユーザー情報が取得できないため複製できません。");
  }

  const duplicated = await duplicatePreset({ userId }, id);
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
