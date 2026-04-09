import { aggregateBudgetProgress } from "@/lib/budgets/aggregation";
import { createBudget, deleteBudget, listBudgetsByLedger, updateBudget } from "@/lib/budgets/repository";
import { BudgetWithCategory, DashboardTransactionRecord } from "@/types/domain";

const to2 = (value: number) => Number(value.toFixed(2));

const validatePeriod = (period: string) => {
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new Error("対象月は YYYY-MM 形式で入力してください");
  }
};

const validateAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("予算金額は0以上で入力してください");
  }
};

export const listBudgetItems = async ({
  householdId,
  ledgerId,
  period,
}: {
  householdId: string;
  ledgerId: string;
  period?: string;
}): Promise<BudgetWithCategory[]> => {
  const rows = await listBudgetsByLedger({ householdId, ledgerId, period });
  return rows.map((row) => ({
    id: row.id,
    householdId: row.household_id,
    ledgerId: row.ledger_id,
    categoryId: row.category_id,
    period: row.period,
    amount: to2(Number(row.amount)),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryName: (row.categories as { name: string } | null)?.name ?? null,
  }));
};

export const createBudgetItem = async (input: {
  householdId: string;
  ledgerId: string;
  categoryId: string | null;
  period: string;
  amount: number;
  createdBy: string;
}) => {
  validatePeriod(input.period);
  validateAmount(input.amount);

  return createBudget({
    ...input,
    amount: to2(input.amount),
  });
};

export const updateBudgetItem = async (input: {
  id: string;
  categoryId: string | null;
  period: string;
  amount: number;
}) => {
  validatePeriod(input.period);
  validateAmount(input.amount);

  return updateBudget({
    ...input,
    amount: to2(input.amount),
  });
};

export const deleteBudgetItem = async (id: string) => deleteBudget(id);

export const buildBudgetProgress = ({
  budgets,
  transactions,
  period,
}: {
  budgets: BudgetWithCategory[];
  transactions: DashboardTransactionRecord[];
  period: string;
}) => {
  return aggregateBudgetProgress({ budgets, transactions, period });
};
