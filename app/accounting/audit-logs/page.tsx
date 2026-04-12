import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/table";
import { resolveAppContext } from "@/lib/context/app-context";
import { listLedgerAuditLogs } from "@/lib/audit/service";

export default async function AccountingAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string; entityType?: string; action?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  const currentLedger = context.ledgers.find((ledger) => ledger.id === context.currentLedgerId);
  if (!currentLedger || currentLedger.type !== "work") {
    return (
      <Card className="space-y-2">
        <h1 className="text-xl font-bold">監査ログ</h1>
        <p className="text-sm text-foreground/70">監査ログはwork台帳でのみ提供しています。</p>
      </Card>
    );
  }

  const logs = await listLedgerAuditLogs({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
    entityType: params.entityType,
    action: params.action,
    from: params.from,
    to: params.to,
  });

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">監査ログ（work台帳）</h1>
        <form method="get" className="grid gap-3 md:grid-cols-6">
          <input type="hidden" name="householdId" value={context.currentHouseholdId} />
          <input type="hidden" name="ledgerId" value={context.currentLedgerId} />
          <label className="text-sm md:col-span-2">
            エンティティ
            <input name="entityType" defaultValue={params.entityType ?? ""} className="mt-1 w-full rounded-md border border-border px-2 py-1" placeholder="transaction など" />
          </label>
          <label className="text-sm md:col-span-2">
            アクション
            <input name="action" defaultValue={params.action ?? ""} className="mt-1 w-full rounded-md border border-border px-2 py-1" placeholder="create など" />
          </label>
          <label className="text-sm">
            期間（開始）
            <input type="date" name="from" defaultValue={params.from ?? ""} className="mt-1 w-full rounded-md border border-border px-2 py-1" />
          </label>
          <label className="text-sm">
            期間（終了）
            <input type="date" name="to" defaultValue={params.to ?? ""} className="mt-1 w-full rounded-md border border-border px-2 py-1" />
          </label>
          <div className="md:col-span-6">
            <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted">フィルタを適用</button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">ログ一覧</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-foreground/70">条件に一致する監査ログはありません。</p>
        ) : (
          <SimpleTable
            headers={["日時", "実行者", "対象", "アクション", "対象ID"]}
            rows={logs.map((log) => [
              new Date(log.createdAt).toLocaleString("ja-JP"),
              log.actorName ?? log.actorUserId,
              log.entityType,
              log.action,
              log.entityId,
            ])}
          />
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">詳細（最新20件）</h2>
        {logs.slice(0, 20).map((log) => (
          <details key={log.id} className="rounded-md border border-border p-3">
            <summary className="cursor-pointer text-sm font-medium">{new Date(log.createdAt).toLocaleString("ja-JP")} / {log.entityType} / {log.action}</summary>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs font-semibold">before</p>
                <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(log.beforeJson, null, 2)}</pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold">after</p>
                <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(log.afterJson, null, 2)}</pre>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold">metadata</p>
                <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-xs">{JSON.stringify(log.metadataJson, null, 2)}</pre>
              </div>
            </div>
          </details>
        ))}
      </Card>
    </div>
  );
}
