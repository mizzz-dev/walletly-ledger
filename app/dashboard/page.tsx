import { CategorySpendingChart } from "@/components/dashboard/category-spending-chart";
import { BudgetProgressPanel } from "@/components/dashboard/budget-progress-panel";
import { SpendingTrendChart } from "@/components/dashboard/spending-trend-chart";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Card } from "@/components/ui/card";
import { resolveAppContext } from "@/lib/context/app-context";
import { getDashboardAggregation } from "@/lib/dashboard/service";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string; yearMonth?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  try {
    const dashboard = await getDashboardAggregation({
      householdId: context.currentHouseholdId,
      ledgerId: context.currentLedgerId,
      yearMonth: params.yearMonth,
    });

    return (
      <section className="space-y-4">
        <Card className="space-y-3">
          <h1 className="text-2xl font-bold">ダッシュボード</h1>
          <p className="text-sm text-foreground/70">{dashboard.summary.yearMonth} の支出状況を表示しています。</p>
          <SummaryCards summary={dashboard.summary} />
        </Card>

        <Card>
          <h2 className="font-semibold">予算 vs 実績</h2>
          <p className="mt-1 text-sm text-foreground/70">カテゴリ別に当月予算の進捗を表示します。超過時は赤色で表示されます。</p>
          <div className="mt-3">
            <BudgetProgressPanel budgetProgress={dashboard.budgetProgress} />
          </div>
        </Card>

        {dashboard.summary.transactionCount === 0 ? (
          <Card>
            <h2 className="font-semibold">データなし</h2>
            <p className="mt-2 text-sm text-foreground/70">今月の取引がありません。支出追加から登録してください。</p>
          </Card>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <h2 className="font-semibold">カテゴリ別支出</h2>
              <p className="mt-1 text-sm text-foreground/70">カテゴリごとの支出割合です。</p>
              <div className="mt-3">
                <CategorySpendingChart categories={dashboard.categories} />
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold">支出推移（日別）</h2>
              <p className="mt-1 text-sm text-foreground/70">当月の日別支出金額です。</p>
              <div className="mt-3">
                <SpendingTrendChart points={dashboard.timeSeries} />
              </div>
            </Card>
          </div>
        )}
      </section>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "ダッシュボードの取得に失敗しました";
    return (
      <Card>
        <h1 className="text-xl font-bold">ダッシュボード</h1>
        <p className="mt-3 text-sm text-rose-600">{message}</p>
      </Card>
    );
  }
}
