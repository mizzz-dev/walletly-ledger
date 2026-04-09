import { BudgetProgressItem } from "@/types/domain";

export const BUDGET_ALERT_THRESHOLD_RATE = 80;

export interface BudgetAlertCandidate {
  level: "threshold_80" | "over_100";
  budgetId: string;
  categoryName: string;
  progressRate: number;
  budgetAmount: number;
  spentAmount: number;
}

const to2 = (value: number) => Number(value.toFixed(2));

export const detectBudgetAlertCandidates = (items: BudgetProgressItem[]): BudgetAlertCandidate[] => {
  return items
    .flatMap((item) => {
      if (item.progressRate >= 100) {
        return [
          {
            level: "over_100" as const,
            budgetId: item.budgetId,
            categoryName: item.categoryName,
            progressRate: to2(item.progressRate),
            budgetAmount: to2(item.budgetAmount),
            spentAmount: to2(item.spentAmount),
          },
        ];
      }

      if (item.progressRate >= BUDGET_ALERT_THRESHOLD_RATE) {
        return [
          {
            level: "threshold_80" as const,
            budgetId: item.budgetId,
            categoryName: item.categoryName,
            progressRate: to2(item.progressRate),
            budgetAmount: to2(item.budgetAmount),
            spentAmount: to2(item.spentAmount),
          },
        ];
      }

      return [];
    })
    .sort((a, b) => b.progressRate - a.progressRate);
};

export const buildBudgetAlertMessage = (candidate: BudgetAlertCandidate) => {
  if (candidate.level === "over_100") {
    return {
      title: `予算超過: ${candidate.categoryName}`,
      body: `${candidate.categoryName} が予算を超過しました（${candidate.progressRate}% / 予算¥${candidate.budgetAmount.toLocaleString()} / 実績¥${candidate.spentAmount.toLocaleString()}）`,
    };
  }

  return {
    title: `予算80%到達: ${candidate.categoryName}`,
    body: `${candidate.categoryName} が予算の80%に到達しました（${candidate.progressRate}% / 予算¥${candidate.budgetAmount.toLocaleString()} / 実績¥${candidate.spentAmount.toLocaleString()}）`,
  };
};
