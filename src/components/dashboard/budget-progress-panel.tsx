import { BudgetProgressSummary } from "@/types/domain";

export const BudgetProgressPanel = ({ budgetProgress }: { budgetProgress: BudgetProgressSummary }) => {
  if (budgetProgress.items.length === 0) {
    return (
      <div className="rounded-xl bg-muted/40 p-4">
        <p className="text-sm text-foreground/70">この月は予算が未設定です。予算管理から追加できます。</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs text-foreground/70">予算合計</p>
          <p className="text-sm font-semibold tabular-nums">¥{budgetProgress.totalBudget.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs text-foreground/70">実績合計</p>
          <p className="text-sm font-semibold tabular-nums">¥{budgetProgress.totalSpent.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs text-foreground/70">残額</p>
          <p className={`text-sm font-semibold tabular-nums ${budgetProgress.totalRemaining < 0 ? "text-rose-700" : "text-emerald-700"}`}>
            ¥{budgetProgress.totalRemaining.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">
          <p className="text-xs text-foreground/70">消化率</p>
          <p className={`text-sm font-semibold tabular-nums ${budgetProgress.hasOverBudget ? "text-rose-700" : "text-indigo-700"}`}>
            {budgetProgress.totalProgressRate.toFixed(1)}%
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {budgetProgress.items.map((item) => {
          const progressWidth = Math.min(item.progressRate, 100);
          return (
            <li key={item.budgetId} className="rounded-xl bg-muted/30 p-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <p className="font-medium">{item.categoryName}</p>
                <p className={item.isOverBudget ? "font-semibold text-rose-700" : "text-foreground/80"}>{item.progressRate.toFixed(1)}%</p>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className={`h-2 rounded-full ${item.isOverBudget ? "bg-rose-500" : "bg-indigo-500"}`} style={{ width: `${progressWidth}%` }} />
              </div>
              <p className="mt-1 text-xs text-foreground/70">
                予算 ¥{item.budgetAmount.toLocaleString()} / 実績 ¥{item.spentAmount.toLocaleString()} / 残額 ¥{item.remainingAmount.toLocaleString()}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
