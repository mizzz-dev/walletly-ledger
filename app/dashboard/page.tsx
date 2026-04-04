import { Card } from "@/components/ui/card";
import { MonthlyOverviewChart } from "@/components/charts/monthly-overview";

export default function DashboardPage() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h1 className="text-xl font-bold">月次サマリ</h1>
        <p className="mt-2 text-sm text-foreground/70">ダミーデータ。将来はSupabase集計に差し替え。</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-muted/50 p-3"><p>総支出</p><p className="text-lg font-bold tabular-nums">¥162,000</p></div>
          <div className="rounded-xl bg-muted/50 p-3"><p>予算進捗</p><p className="text-lg font-bold tabular-nums">81%</p></div>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">カテゴリ別</h2>
        <MonthlyOverviewChart />
      </Card>
    </section>
  );
}
