import { BudgetProgressSummary, BudgetWithCategory, DashboardTransactionRecord } from "@/types/domain";

const OVERALL_BUDGET_NAME = "全体予算";

const to2 = (value: number) => Number(value.toFixed(2));

const normalizePositiveAmount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return to2(value);
};

const resolveYearMonthFromDate = (date: string) => {
  if (!date) return null;
  const yearMonth = date.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(yearMonth) ? yearMonth : null;
};

const safeProgressRate = ({ spent, budget }: { spent: number; budget: number }) => {
  if (budget <= 0) {
    return spent > 0 ? 100 : 0;
  }

  return to2((spent / budget) * 100);
};

export const aggregateBudgetProgress = ({
  budgets,
  transactions,
  period,
}: {
  budgets: BudgetWithCategory[];
  transactions: DashboardTransactionRecord[];
  period: string;
}): BudgetProgressSummary => {
  const filteredBudgets = budgets.filter((budget) => budget.period === period);
  if (filteredBudgets.length === 0) {
    return {
      period,
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      totalProgressRate: 0,
      hasOverBudget: false,
      items: [],
    };
  }

  const targetTransactions = transactions.filter((transaction) => resolveYearMonthFromDate(transaction.date) === period);
  const totalSpentInPeriod = to2(targetTransactions.reduce((sum, row) => sum + normalizePositiveAmount(row.amount), 0));

  const categorySpentMap = new Map<string, number>();
  targetTransactions.forEach((row) => {
    if (!row.categoryId) {
      return;
    }
    const current = categorySpentMap.get(row.categoryId) ?? 0;
    categorySpentMap.set(row.categoryId, to2(current + normalizePositiveAmount(row.amount)));
  });

  const items = filteredBudgets
    .map((budget) => {
      const spentAmount = budget.categoryId ? categorySpentMap.get(budget.categoryId) ?? 0 : totalSpentInPeriod;
      const budgetAmount = normalizePositiveAmount(budget.amount);
      const remainingAmount = to2(budgetAmount - spentAmount);
      const progressRate = safeProgressRate({ spent: spentAmount, budget: budgetAmount });

      return {
        budgetId: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.categoryName ?? OVERALL_BUDGET_NAME,
        period: budget.period,
        budgetAmount,
        spentAmount,
        remainingAmount,
        progressRate,
        isOverBudget: spentAmount > budgetAmount,
      };
    })
    .sort((a, b) => {
      if (a.categoryId === null) return -1;
      if (b.categoryId === null) return 1;
      return b.progressRate - a.progressRate;
    });

  const totalBudget = to2(items.reduce((sum, item) => sum + item.budgetAmount, 0));
  const totalSpent = to2(items.reduce((sum, item) => sum + item.spentAmount, 0));
  const totalRemaining = to2(items.reduce((sum, item) => sum + item.remainingAmount, 0));

  return {
    period,
    totalBudget,
    totalSpent,
    totalRemaining,
    totalProgressRate: safeProgressRate({ spent: totalSpent, budget: totalBudget }),
    hasOverBudget: items.some((item) => item.isOverBudget),
    items,
  };
};
