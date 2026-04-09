import { BudgetsClient } from "@/app/budgets/budgets-client";
import { buildBudgetProgress, listBudgetItems } from "@/lib/budgets/service";
import { resolveAppContext } from "@/lib/context/app-context";
import { listDashboardTransactions } from "@/lib/dashboard/repository";
import { DashboardTransactionRecord } from "@/types/domain";

const resolveTargetPeriod = (value?: string) => {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const toSingleCategory = (
  value: { name: string; color: string } | { name: string; color: string }[] | null,
): { name: string; color: string } | null => {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string; period?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId || !context.userId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  const targetPeriod = resolveTargetPeriod(params.period);

  const [budgets, dashboardRows] = await Promise.all([
    listBudgetItems({
      householdId: context.currentHouseholdId,
      ledgerId: context.currentLedgerId,
      period: targetPeriod,
    }).catch(() => []),
    listDashboardTransactions({
      householdId: context.currentHouseholdId,
      ledgerId: context.currentLedgerId,
    }).catch(() => []),
  ]);

  const transactions: DashboardTransactionRecord[] = dashboardRows.map((row) => {
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

  const progress = buildBudgetProgress({
    budgets,
    transactions,
    period: targetPeriod,
  });

  const membership = context.members.find((member) => member.userId === context.userId);
  const canEdit = membership?.role === "owner" || membership?.role === "editor";

  return (
    <BudgetsClient
      budgets={budgets}
      categories={context.categories}
      householdId={context.currentHouseholdId}
      ledgerId={context.currentLedgerId}
      currentUserId={context.userId}
      initialPeriod={targetPeriod}
      canEdit={Boolean(canEdit)}
      budgetProgress={progress}
    />
  );
}
