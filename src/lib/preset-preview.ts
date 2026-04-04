import { calculateSplit, validateMemberCount } from "@/lib/split";
import { CategorySplitPreset, SplitResult } from "@/types/domain";

export const previewPresetSplit = ({
  amount,
  memberIds,
  preset,
}: {
  amount: number;
  memberIds: string[];
  preset: CategorySplitPreset;
}): SplitResult[] => {
  validateMemberCount(memberIds.length, preset.members);

  const members = memberIds.map((memberId, index) => {
    const config = preset.members[index];
    if (config.memberId !== memberId) {
      throw new Error("プリセットのメンバー構成と対象メンバーが一致しません");
    }
    return {
      memberId,
      ratio: config.ratio,
      weight: config.weight,
      fixedAmount: config.fixedAmount,
    };
  });

  return calculateSplit({
    amount,
    members,
    method: preset.splitMethod,
    rounding: preset.roundingMode,
  });
};
