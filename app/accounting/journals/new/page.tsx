import Link from "next/link";
import { Card } from "@/components/ui/card";
import { resolveAppContext } from "@/lib/context/app-context";
import { buildDraftFromTransaction, listTransactionOptionsForDraft } from "@/lib/accounting/service";
import { NewJournalForm } from "@/app/accounting/journals/new/new-journal-form";

export default async function NewAccountingJournalPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string; transactionId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId || !context.userId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  const currentLedger = context.ledgers.find((ledger) => ledger.id === context.currentLedgerId);
  if (!currentLedger || currentLedger.type !== "work") {
    return (
      <Card>
        <h1 className="text-xl font-bold">仕訳作成</h1>
        <p className="mt-2 text-sm text-foreground/70">work台帳以外では会計モードを利用できません。</p>
      </Card>
    );
  }

  const transactionOptions = await listTransactionOptionsForDraft({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
  });

  const selectedTransactionId = params.transactionId ?? transactionOptions[0]?.id;

  if (!selectedTransactionId) {
    return (
      <Card>
        <h1 className="text-xl font-bold">仕訳作成</h1>
        <p className="mt-2 text-sm text-foreground/70">対象となる取引がありません。先に取引を登録してください。</p>
      </Card>
    );
  }

  const { draft, accounts } = await buildDraftFromTransaction({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
    ledgerType: currentLedger.type,
    transactionId: selectedTransactionId,
  });

  return (
    <Card className="space-y-4">
      <h1 className="text-xl font-bold">仕訳下書き作成</h1>
      <form method="get" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="householdId" value={context.currentHouseholdId} />
        <input type="hidden" name="ledgerId" value={context.currentLedgerId} />
        <label className="text-sm">
          元取引
          <select className="ml-2 rounded-md border border-border px-2 py-1" name="transactionId" defaultValue={selectedTransactionId}>
            {transactionOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.transactionDate} / ¥{option.amount.toLocaleString()} / {option.merchant ?? "取引"}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted">候補を再生成</button>
      </form>

      <NewJournalForm
        householdId={context.currentHouseholdId}
        ledgerId={context.currentLedgerId}
        ledgerType="work"
        createdBy={context.userId}
        draft={draft}
        accounts={accounts}
      />

      <Link href={`/accounting/journals?householdId=${context.currentHouseholdId}&ledgerId=${context.currentLedgerId}`} className="text-sm text-foreground/70 underline">
        仕訳一覧へ戻る
      </Link>
    </Card>
  );
}
