import { roundAmount } from "@/lib/rounding";
import { RoundingMode, SplitInputMember, SplitMethod, SplitResult } from "@/types/domain";

const assertAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("金額は正の数で指定してください");
};

const adjustDiff = (results: SplitResult[], total: number): SplitResult[] => {
  const current = results.reduce((acc, v) => acc + v.amount, 0);
  const diff = Number((total - current).toFixed(2));
  if (Math.abs(diff) < 0.01) return results;
  const sorted = [...results].sort((a, b) => b.amount - a.amount);
  sorted[0] = { ...sorted[0], amount: Number((sorted[0].amount + diff).toFixed(2)) };
  return sorted;
};

export const calculateSplit = ({
  amount,
  method,
  members,
  rounding = "round",
}: {
  amount: number;
  method: SplitMethod;
  members: SplitInputMember[];
  rounding?: RoundingMode;
}): SplitResult[] => {
  assertAmount(amount);
  if (members.length === 0) throw new Error("メンバーが必要です");

  if (method === "equal") {
    const each = amount / members.length;
    return adjustDiff(
      members.map((m) => ({ memberId: m.memberId, amount: roundAmount(each, rounding, 2) })),
      amount,
    );
  }

  if (method === "ratio" || method === "weight") {
    const key = method === "ratio" ? "ratio" : "weight";
    const sum = members.reduce((acc, member) => acc + (member[key] ?? 0), 0);
    if (sum <= 0) throw new Error("比率または重みの合計が不正です");
    return adjustDiff(
      members.map((m) => ({
        memberId: m.memberId,
        amount: roundAmount((amount * (m[key] ?? 0)) / sum, rounding, 2),
      })),
      amount,
    );
  }

  const fixed = members.reduce((acc, m) => acc + (m.fixedAmount ?? 0), 0);
  if (fixed > amount) throw new Error("固定額の合計が金額を超えています");
  const noFixed = members.filter((m) => (m.fixedAmount ?? 0) === 0);
  const remainder = amount - fixed;
  const each = noFixed.length > 0 ? remainder / noFixed.length : 0;
  return adjustDiff(
    members.map((m) => ({
      memberId: m.memberId,
      amount: roundAmount((m.fixedAmount ?? 0) || each, rounding, 2),
    })),
    amount,
  );
};

export const validateMemberCount = (expected: number, members: SplitInputMember[]) => {
  if (expected !== members.length) throw new Error("メンバー数が一致しません");
};
