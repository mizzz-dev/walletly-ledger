import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/table";
import { resolveAppContext } from "@/lib/context/app-context";
import { getTrialBalanceReport } from "@/lib/accounting/reporting-service";

export default async function TrialBalancePage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  const currentLedger = context.ledgers.find((ledger) => ledger.id === context.currentLedgerId);
  if (!currentLedger || currentLedger.type !== "work") {
    return (
      <Card>
        <h1 className="text-xl font-bold">試算表</h1>
        <p className="mt-2 text-sm text-foreground/70">work台帳以外では試算表を表示できません。</p>
      </Card>
    );
  }

  const report = await getTrialBalanceReport({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
    ledgerType: currentLedger.type,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  return (
    <Card className="space-y-3">
      <h1 className="text-xl font-bold">試算表（簡易）</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="householdId" value={context.currentHouseholdId} />
        <input type="hidden" name="ledgerId" value={context.currentLedgerId} />
        <label className="text-sm">
          開始日
          <input className="ml-2 rounded-md border border-border px-2 py-1" type="date" name="dateFrom" defaultValue={report.dateFrom} />
        </label>
        <label className="text-sm">
          終了日
          <input className="ml-2 rounded-md border border-border px-2 py-1" type="date" name="dateTo" defaultValue={report.dateTo} />
        </label>
        <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted">期間を更新</button>
      </form>
      <p className={report.isBalanced ? "text-sm text-emerald-600" : "text-sm text-rose-600"}>
        貸借判定: {report.isBalanced ? "一致" : "不一致"}
      </p>
      {report.rows.length === 0 ? (
        <p className="text-sm text-foreground/70">対象期間にデータがありません。</p>
      ) : (
        <SimpleTable
          headers={["科目コード", "科目名", "区分", "借方", "貸方", "差額"]}
          rows={report.rows.map((row) => [
            row.accountCode,
            row.accountName,
            row.accountCategory,
            `¥${row.debit.toLocaleString()}`,
            `¥${row.credit.toLocaleString()}`,
            `¥${row.diff.toLocaleString()}`,
          ])}
        />
      )}
      <div className="rounded-md bg-muted p-3 text-sm">
        <p>借方合計: ¥{report.totalDebit.toLocaleString()}</p>
        <p>貸方合計: ¥{report.totalCredit.toLocaleString()}</p>
      </div>
    </Card>
  );
}
