import Link from "next/link";
import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/table";
import { resolveAppContext } from "@/lib/context/app-context";
import { listLedgerJournals } from "@/lib/accounting/service";
import { calculateJournalBalance } from "@/lib/accounting/journal-balance";

export default async function AccountingJournalsPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  const currentLedger = context.ledgers.find((ledger) => ledger.id === context.currentLedgerId);
  if (!currentLedger || currentLedger.type !== "work") {
    return (
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">会計仕訳</h1>
        <p className="text-sm text-foreground/70">会計モードは work 台帳でのみ利用できます。家計簿用途では既存の取引入力をご利用ください。</p>
      </Card>
    );
  }

  const journals = await listLedgerJournals({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
    ledgerType: currentLedger.type,
  });

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">会計仕訳（work台帳）</h1>
          <p className="text-xs text-foreground/70">取引由来の仕訳ドラフトを確認して保存できます。</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <Link className="underline" href={`/accounting/exports?householdId=${context.currentHouseholdId}&ledgerId=${context.currentLedgerId}`}>
              税務エクスポート
            </Link>
            <Link className="underline" href={`/accounting/reports/trial-balance?householdId=${context.currentHouseholdId}&ledgerId=${context.currentLedgerId}`}>
              試算表
            </Link>
            <Link className="underline" href={`/accounting/reports/general-ledger?householdId=${context.currentHouseholdId}&ledgerId=${context.currentLedgerId}`}>
              総勘定元帳
            </Link>
          </div>
        </div>
        <Link
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
          href={`/accounting/journals/new?householdId=${context.currentHouseholdId}&ledgerId=${context.currentLedgerId}`}
        >
          仕訳を作成
        </Link>
      </div>
      {journals.length === 0 ? (
        <p className="text-sm text-foreground/70">仕訳はまだありません。取引から下書きを作成してください。</p>
      ) : (
        <SimpleTable
          headers={["日付", "摘要", "状態", "借方合計", "貸方合計", "元データ"]}
          rows={journals.map((journal) => {
            const balance = calculateJournalBalance(journal.lines);
            return [
              journal.journalDate,
              journal.description,
              journal.status === "posted" ? "確定" : "下書き",
              `¥${balance.totalDebit.toLocaleString()}`,
              `¥${balance.totalCredit.toLocaleString()}`,
              `${journal.sourceType ?? "manual"} / ${journal.sourceReferenceId ?? "-"}`,
            ];
          })}
        />
      )}
    </Card>
  );
}
