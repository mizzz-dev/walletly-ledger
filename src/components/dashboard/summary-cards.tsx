import { DashboardSummary } from "@/types/domain";

const formatDiff = (value: number) => {
  if (value === 0) {
    return "±0";
  }

  return `${value > 0 ? "+" : "-"}¥${Math.abs(value).toLocaleString()}`;
};

export const SummaryCards = ({ summary }: { summary: DashboardSummary }) => {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl bg-muted/50 p-4">
        <p className="text-sm text-foreground/70">今月の総支出</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">¥{summary.totalSpent.toLocaleString()}</p>
      </div>
      <div className="rounded-2xl bg-muted/50 p-4">
        <p className="text-sm text-foreground/70">前月比</p>
        <p className={`mt-1 text-2xl font-bold tabular-nums ${summary.diffFromPreviousMonth <= 0 ? "text-emerald-700" : "text-rose-700"}`}>
          {formatDiff(summary.diffFromPreviousMonth)}
        </p>
        <p className="mt-1 text-xs text-foreground/70">前月: ¥{summary.previousMonthTotalSpent.toLocaleString()}</p>
      </div>
      <div className="rounded-2xl bg-muted/50 p-4">
        <p className="text-sm text-foreground/70">取引件数</p>
        <p className="mt-1 text-3xl font-bold tabular-nums">{summary.transactionCount.toLocaleString()}件</p>
      </div>
    </div>
  );
};
