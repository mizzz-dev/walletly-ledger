import Link from "next/link";
import { Card } from "@/components/ui/card";
import { resolveAppContext } from "@/lib/context/app-context";
import { listBankAccountsByScope } from "@/lib/banking/repositories/banking-repository";
import { listBankTransactionCandidates } from "@/lib/banking/service";

const directionLabel = {
  outflow: "出金",
  inflow: "入金",
};

export default async function BankingTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    householdId?: string;
    ledgerId?: string;
    accountId?: string;
    onlyUnimported?: string;
  }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.userId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯がありません。</p>;
  }

  const accountId = params.accountId;
  const onlyUnimported = params.onlyUnimported === "1";

  const [accounts, candidates] = await Promise.all([
    listBankAccountsByScope({ householdId: context.currentHouseholdId, ledgerId: context.currentLedgerId }),
    listBankTransactionCandidates({
      householdId: context.currentHouseholdId,
      ledgerId: context.currentLedgerId,
      accountId,
      onlyUnimported,
    }),
  ]);

  const scopeQuery = `householdId=${context.currentHouseholdId}${context.currentLedgerId ? `&ledgerId=${context.currentLedgerId}` : ""}`;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">銀行明細一覧</h1>
          <div className="flex gap-3 text-sm">
            <Link href={`/banking?${scopeQuery}`} className="text-primary underline underline-offset-2">銀行接続へ戻る</Link>
            <Link href={`/banking/review?${scopeQuery}`} className="text-primary underline underline-offset-2">レビュー画面へ</Link>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href={`/banking/transactions?${scopeQuery}`} className="rounded-lg border border-border px-3 py-1">全口座</Link>
          {accounts.map((account) => (
            <Link
              key={account.id}
              href={`/banking/transactions?${scopeQuery}&accountId=${account.id}&onlyUnimported=${onlyUnimported ? "1" : "0"}`}
              className="rounded-lg border border-border px-3 py-1"
            >
              {account.displayName}
            </Link>
          ))}
          <Link
            href={`/banking/transactions?${scopeQuery}&onlyUnimported=${onlyUnimported ? "0" : "1"}`}
            className="rounded-lg border border-border px-3 py-1"
          >
            {onlyUnimported ? "取込済み含む" : "未取込のみ"}
          </Link>
        </div>
      </Card>

      <Card>
        {candidates.length === 0 ? (
          <p className="text-sm text-foreground/70">表示できる銀行明細がありません。</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {candidates.map((candidate) => (
              <li key={candidate.bankTransactionId} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold">{candidate.suggestedDate} / {candidate.accountDisplayName}</p>
                    <p className="text-sm">{candidate.suggestedMerchant}</p>
                    <p className="text-xs text-foreground/70">{candidate.suggestedNote}</p>
                    <p className="text-xs text-foreground/70">状態: {candidate.matchStatus === "imported" ? "取込済み" : "未取込"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {directionLabel[candidate.direction]} ¥{candidate.suggestedAmount.toLocaleString()}
                    </p>
                    {candidate.matchStatus === "imported" ? (
                      <p className="text-xs text-emerald-700">取込済み</p>
                    ) : (
                      <Link
                        className="text-sm text-primary underline underline-offset-2"
                        href={`/transactions/new?${scopeQuery}&bankTransactionId=${candidate.bankTransactionId}&amount=${candidate.suggestedAmount}&date=${candidate.suggestedDate}&merchant=${encodeURIComponent(candidate.suggestedMerchant)}&note=${encodeURIComponent(candidate.suggestedNote)}`}
                      >
                        支出として取り込む
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
