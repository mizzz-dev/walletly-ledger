import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { resolveAppContext } from "@/lib/context/app-context";
import { listBankingOverview } from "@/lib/banking/service";
import { createBankConnectionAction, syncBankConnectionAction } from "@/app/banking/actions";

const statusLabel: Record<string, string> = {
  connected: "接続中",
  error: "エラー",
  disconnected: "切断",
  pending: "待機中",
};

export default async function BankingPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.userId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯がありません。</p>;
  }

  const overview = await listBankingOverview({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
  }).catch(() => ({ connections: [], accounts: [], transactions: [] }));

  const scopeQuery = `householdId=${context.currentHouseholdId}${context.currentLedgerId ? `&ledgerId=${context.currentLedgerId}` : ""}`;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">銀行連携</h1>
            <p className="text-sm text-foreground/70">今回は provider 抽象化の基盤実装です。接続作成はモックです。</p>
          </div>
          <Link href={`/banking/transactions?${scopeQuery}`} className="text-sm text-primary underline underline-offset-2">
            明細一覧へ
          </Link>
        </div>
        <form action={createBankConnectionAction} className="flex flex-wrap items-end gap-3 rounded-xl border border-border p-3">
          <input type="hidden" name="householdId" value={context.currentHouseholdId} />
          <input type="hidden" name="ledgerId" value={context.currentLedgerId ?? ""} />
          <input type="hidden" name="userId" value={context.userId} />
          <input type="hidden" name="provider" value="mock" />
          <p className="text-sm">モック provider の銀行接続を作成します。</p>
          <Button type="submit">接続を追加</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">接続一覧</h2>
        {overview.connections.length === 0 ? (
          <p className="text-sm text-foreground/70">まだ銀行接続がありません。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {overview.connections.map((connection) => (
              <li key={connection.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{connection.provider}</p>
                    <p className="text-xs text-foreground/70">状態: {statusLabel[connection.status] ?? connection.status}</p>
                    <p className="text-xs text-foreground/70">最終同期: {connection.lastSyncedAt ?? "未同期"}</p>
                  </div>
                  <form action={syncBankConnectionAction}>
                    <input type="hidden" name="connectionId" value={connection.id} />
                    <input type="hidden" name="householdId" value={context.currentHouseholdId} />
                    <input type="hidden" name="userId" value={context.userId} />
                    <Button type="submit" variant="outline">手動同期</Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold">口座一覧</h2>
        {overview.accounts.length === 0 ? (
          <p className="text-sm text-foreground/70">同期済み口座はまだありません。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {overview.accounts.map((account) => (
              <li key={account.id} className="rounded-xl border border-border p-3">
                <p className="font-semibold">{account.displayName}</p>
                <p className="text-xs text-foreground/70">{account.accountType} / {account.currency} / {account.maskedAccountNumber ?? "番号非表示"}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
