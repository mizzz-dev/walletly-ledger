import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/table";
import { resolveAppContext } from "@/lib/context/app-context";
import { listLedgerClosures } from "@/lib/accounting/closures/service";
import { ClosePeriodForm } from "@/app/accounting/closures/close-period-form";

export default async function AccountingClosuresPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string }>;
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
        <h1 className="text-xl font-bold">月次締め</h1>
        <p className="text-sm text-foreground/70">月次締めはwork台帳でのみ利用できます。</p>
      </Card>
    );
  }

  const membership = context.members.find((member) => member.userId === context.userId);
  const canClose = membership?.role === "owner" || membership?.role === "editor";
  const closures = await listLedgerClosures({ householdId: context.currentHouseholdId, ledgerId: context.currentLedgerId });
  const defaultPeriod = new Date().toISOString().slice(0, 7);

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">月次締め（work台帳）</h1>
        <p className="text-sm text-foreground/70">会計運用のために月次単位で期間を締め、締め済み期間の更新を制限します。</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link className="underline" href={`/accounting/journals?householdId=${context.currentHouseholdId}&ledgerId=${context.currentLedgerId}`}>仕訳一覧</Link>
          <Link className="underline" href={`/accounting/audit-logs?householdId=${context.currentHouseholdId}&ledgerId=${context.currentLedgerId}`}>監査ログ</Link>
        </div>
        {canClose ? (
          <ClosePeriodForm householdId={context.currentHouseholdId} ledgerId={context.currentLedgerId} actorUserId={context.userId} defaultPeriod={defaultPeriod} />
        ) : (
          <p className="text-sm text-amber-600">viewer権限では締め実行できません。締め状態の閲覧のみ可能です。</p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">締め履歴</h2>
        {closures.length === 0 ? (
          <p className="text-sm text-foreground/70">まだ締め履歴がありません。</p>
        ) : (
          <SimpleTable
            headers={["対象期間", "状態", "締め日時", "実行者", "メモ"]}
            rows={closures.map((closure) => [
              `${closure.periodStart} 〜 ${closure.periodEnd}`,
              closure.status === "closed" ? "締め済み" : "未締め",
              closure.closedAt ? new Date(closure.closedAt).toLocaleString("ja-JP") : "-",
              closure.closedBy ?? "-",
              closure.note ?? "-",
            ])}
          />
        )}
      </Card>
    </div>
  );
}
