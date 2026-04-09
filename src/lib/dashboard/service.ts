import { aggregateDashboardData } from "@/lib/dashboard/aggregation";
import { listDashboardTransactions } from "@/lib/dashboard/repository";
import { buildBudgetProgress, listBudgetItems } from "@/lib/budgets/service";
import { DashboardAggregationResult, DashboardTransactionRecord } from "@/types/domain";

const toSingleCategory = (
  value: { name: string; color: string } | { name: string; color: string }[] | null,
): { name: string; color: string } | null => {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

export const getDashboardAggregation = async ({
  householdId,
  ledgerId,
  yearMonth,
}: {
  householdId: string;
  ledgerId: string;
  yearMonth?: string;
}): Promise<DashboardAggregationResult> => {
  const now = new Date();
  const fallbackYearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const targetYearMonth = yearMonth && /^\d{4}-\d{2}$/.test(yearMonth) ? yearMonth : fallbackYearMonth;

  const rows = await listDashboardTransactions({ householdId, ledgerId });
  const transactions: DashboardTransactionRecord[] = rows.map((row) => {
    const category = toSingleCategory(row.categories);
    return {
      id: row.id,
      date: row.transaction_date,
      amount: Number(row.amount),
      categoryId: row.category_id,
      categoryName: category?.name ?? null,
      categoryColor: category?.color ?? null,
    };
  });

  const dashboard = aggregateDashboardData({ transactions, yearMonth: targetYearMonth });
  const budgets = await listBudgetItems({ householdId, ledgerId, period: targetYearMonth }).catch(() => []);
  const budgetProgress = buildBudgetProgress({
    budgets,
    transactions,
    period: targetYearMonth,
  });

  return {
    ...dashboard,
    budgetProgress,
  };
};
