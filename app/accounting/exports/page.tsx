import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/table";
import { resolveAppContext } from "@/lib/context/app-context";
import { getAccountingExportOverview } from "@/lib/accounting/reporting-service";

export default async function AccountingExportsPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId || !context.userId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  const currentLedger = context.ledgers.find((ledger) => ledger.id === context.currentLedgerId);
  if (!currentLedger || currentLedger.type !== "work") {
    return (
      <Card className="space-y-2">
        <h1 className="text-xl font-bold">会計エクスポート</h1>
        <p className="text-sm text-foreground/70">work台帳以外では税務エクスポートを利用できません。</p>
      </Card>
    );
  }

  const membership = context.members.find((member) => member.userId === context.userId);
  const canExport = membership?.role === "owner" || membership?.role === "editor";

  const overview = await getAccountingExportOverview({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
    ledgerType: currentLedger.type,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  const query = new URLSearchParams({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
    dateFrom: overview.dateFrom,
    dateTo: overview.dateTo,
    format: "generic_csv",
  });

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">会計エクスポート（work台帳）</h1>
        <p className="text-sm text-foreground/70">
          対象: 仕訳CSV（generic）、税区分別集計プレビュー。非対象: 申告書作成、電子申告形式、会計ソフト完全互換。
        </p>
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="householdId" value={context.currentHouseholdId} />
          <input type="hidden" name="ledgerId" value={context.currentLedgerId} />
          <label className="text-sm">
            開始日
            <input className="ml-2 rounded-md border border-border px-2 py-1" type="date" name="dateFrom" defaultValue={overview.dateFrom} />
          </label>
          <label className="text-sm">
            終了日
            <input className="ml-2 rounded-md border border-border px-2 py-1" type="date" name="dateTo" defaultValue={overview.dateTo} />
          </label>
          <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted">集計を更新</button>
        </form>
        <p className="text-xs text-foreground/70">対象期間の仕訳明細: {overview.lineCount.toLocaleString()} 行</p>
        {canExport ? (
          <Link className="inline-block rounded-md border border-border px-3 py-2 text-sm hover:bg-muted" href={`/accounting/exports/journals.csv?${query.toString()}`}>
            仕訳CSVをダウンロード
          </Link>
        ) : (
          <p className="text-sm text-amber-600">viewer権限ではCSVエクスポートできません（プレビュー閲覧のみ）。</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">税区分集計プレビュー</h2>
        {overview.taxSummary.length === 0 ? (
          <p className="text-sm text-foreground/70">対象期間の仕訳がありません。</p>
        ) : (
          <SimpleTable
            headers={["税区分", "税区分名", "行数", "金額合計"]}
            rows={overview.taxSummary.map((row) => [row.taxCode, row.taxLabel, row.lineCount.toLocaleString(), `¥${row.totalAmount.toLocaleString()}`])}
          />
        )}
      </Card>
    </div>
  );
}
