import {
  DashboardAggregationResult,
  DashboardCategorySummary,
  DashboardSummary,
  DashboardTimeSeriesPoint,
  DashboardTransactionRecord,
} from "@/types/domain";

const UNCATEGORIZED_ID = "uncategorized";
const UNCATEGORIZED_NAME = "未分類";
const DEFAULT_CATEGORY_COLOR = "#94a3b8";

const to2 = (value: number) => Number(value.toFixed(2));

const isValidYearMonth = (value: string) => /^\d{4}-\d{2}$/.test(value);

const resolveYearMonthFromDate = (date: string) => {
  if (!date) return null;
  const yearMonth = date.slice(0, 7);
  return isValidYearMonth(yearMonth) ? yearMonth : null;
};

export const resolvePreviousYearMonth = (yearMonth: string) => {
  const [year, month] = yearMonth.split("-").map((value) => Number(value));
  const source = new Date(Date.UTC(year, month - 1, 1));
  source.setUTCMonth(source.getUTCMonth() - 1);
  const nextYear = source.getUTCFullYear();
  const nextMonth = String(source.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
};

const resolveCurrentYearMonth = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const normalizeAmount = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return to2(value);
};

const toCategoryKey = (transaction: DashboardTransactionRecord) => {
  return transaction.categoryId || UNCATEGORIZED_ID;
};

const toTimeSeriesLabel = (date: string) => {
  const [year, month, day] = date.split("-").map((value) => Number(value));
  if (!year || !month || !day) {
    return date;
  }
  return `${month}/${day}`;
};

export const aggregateDashboardData = ({
  transactions,
  yearMonth,
}: {
  transactions: DashboardTransactionRecord[];
  yearMonth?: string;
}): DashboardAggregationResult => {
  const targetYearMonth = yearMonth && isValidYearMonth(yearMonth) ? yearMonth : resolveCurrentYearMonth();
  const previousYearMonth = resolvePreviousYearMonth(targetYearMonth);

  const currentMonthTransactions = transactions.filter((transaction) => {
    const ym = resolveYearMonthFromDate(transaction.date);
    return ym === targetYearMonth;
  });

  const previousMonthTotalSpent = to2(
    transactions
      .filter((transaction) => resolveYearMonthFromDate(transaction.date) === previousYearMonth)
      .reduce((sum, transaction) => sum + normalizeAmount(transaction.amount), 0),
  );

  const totalSpent = to2(
    currentMonthTransactions.reduce((sum, transaction) => sum + normalizeAmount(transaction.amount), 0),
  );

  const summary: DashboardSummary = {
    yearMonth: targetYearMonth,
    totalSpent,
    transactionCount: currentMonthTransactions.length,
    previousMonthTotalSpent,
    diffFromPreviousMonth: to2(totalSpent - previousMonthTotalSpent),
  };

  const categoryMap = new Map<string, DashboardCategorySummary>();
  currentMonthTransactions.forEach((transaction) => {
    const key = toCategoryKey(transaction);
    const existing = categoryMap.get(key);
    const amount = normalizeAmount(transaction.amount);

    if (!existing) {
      categoryMap.set(key, {
        categoryId: key,
        categoryName: transaction.categoryName || UNCATEGORIZED_NAME,
        categoryColor: transaction.categoryColor || DEFAULT_CATEGORY_COLOR,
        totalSpent: amount,
        percentage: 0,
      });
      return;
    }

    existing.totalSpent = to2(existing.totalSpent + amount);
  });

  const categories = Array.from(categoryMap.values())
    .map((category) => ({
      ...category,
      percentage: totalSpent > 0 ? to2((category.totalSpent / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent);

  const timeSeriesMap = new Map<string, number>();
  currentMonthTransactions.forEach((transaction) => {
    if (!transaction.date) {
      return;
    }
    const amount = normalizeAmount(transaction.amount);
    const current = timeSeriesMap.get(transaction.date) ?? 0;
    timeSeriesMap.set(transaction.date, to2(current + amount));
  });

  const timeSeries: DashboardTimeSeriesPoint[] = Array.from(timeSeriesMap.entries())
    .sort(([dateA], [dateB]) => (dateA > dateB ? 1 : -1))
    .map(([date, dayTotal]) => ({
      date,
      label: toTimeSeriesLabel(date),
      totalSpent: dayTotal,
    }));

  return {
    summary,
    categories,
    timeSeries,
    budgetProgress: {
      period: targetYearMonth,
      totalBudget: 0,
      totalSpent: 0,
      totalRemaining: 0,
      totalProgressRate: 0,
      hasOverBudget: false,
      items: [],
    },
  };
};
