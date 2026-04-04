import { CategorySplitPreset, PresetMatchInput } from "@/types/domain";

const containsKeyword = (note: string, keywords?: string[]) => {
  if (!keywords || keywords.length === 0) return true;
  const normalized = note.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
};

const includesMerchant = (merchantName: string, expected?: string) => {
  if (!expected) return true;
  return merchantName.toLowerCase().includes(expected.toLowerCase());
};

export const matchesPresetCondition = (preset: CategorySplitPreset, input: PresetMatchInput): boolean => {
  if (!preset.targetCategoryIds.includes(input.categoryId)) return false;
  const condition = preset.conditions;
  if (!condition) return true;

  if (condition.minAmount !== undefined && input.amount < condition.minAmount) return false;
  if (!containsKeyword(input.note ?? "", condition.keywords)) return false;
  if (!includesMerchant(input.merchantName ?? "", condition.merchantName)) return false;

  if (condition.weekdays && condition.weekdays.length > 0) {
    const weekday = new Date(input.transactionDate).getDay();
    if (!condition.weekdays.includes(weekday)) return false;
  }

  return true;
};

export const findApplicablePreset = (
  presets: CategorySplitPreset[],
  input: PresetMatchInput,
): CategorySplitPreset | undefined => {
  return [...presets]
    .filter((preset) => preset.status === "published")
    .sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt))
    .find((preset) => matchesPresetCondition(preset, input));
};
