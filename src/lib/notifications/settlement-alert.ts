import { MemberSettlementSummary } from "@/types/domain";

export const DEFAULT_SETTLEMENT_REMIND_DAYS = 7;

export interface SettlementReminderCandidate {
  overdueMemberCount: number;
  unsettledAmount: number;
  remindAfterDays: number;
}

const to2 = (value: number) => Number(value.toFixed(2));

export const detectSettlementReminderCandidate = ({
  summaries,
  lastSettlementAt,
  now,
  remindAfterDays,
}: {
  summaries: MemberSettlementSummary[];
  lastSettlementAt: string | null;
  now: Date;
  remindAfterDays?: number;
}): SettlementReminderCandidate | null => {
  const targetDays = remindAfterDays ?? DEFAULT_SETTLEMENT_REMIND_DAYS;
  const unsettledMembers = summaries.filter((summary) => Math.abs(summary.net) > 0.009);
  if (unsettledMembers.length === 0) {
    return null;
  }

  if (!lastSettlementAt) {
    return {
      overdueMemberCount: unsettledMembers.length,
      unsettledAmount: to2(unsettledMembers.reduce((sum, member) => sum + Math.abs(member.net), 0) / 2),
      remindAfterDays: targetDays,
    };
  }

  const elapsedMs = now.getTime() - new Date(lastSettlementAt).getTime();
  const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000);
  if (elapsedDays < targetDays) {
    return null;
  }

  return {
    overdueMemberCount: unsettledMembers.length,
    unsettledAmount: to2(unsettledMembers.reduce((sum, member) => sum + Math.abs(member.net), 0) / 2),
    remindAfterDays: targetDays,
  };
};

export const buildSettlementReminderMessage = (candidate: SettlementReminderCandidate) => ({
  title: "精算リマインド",
  body: `未精算メンバー${candidate.overdueMemberCount}名、残高合計¥${candidate.unsettledAmount.toLocaleString()}です。${candidate.remindAfterDays}日以上未精算のため確認してください。`,
});
