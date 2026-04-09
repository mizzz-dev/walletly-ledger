import Link from "next/link";
import { Card } from "@/components/ui/card";
import { resolveAppContext } from "@/lib/context/app-context";
import { listBankReviewItems } from "@/lib/banking/service";
import { BankingReviewClient } from "./review-client";

export default async function BankingReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string; onlyUnimported?: string; accountId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId || !context.userId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  const onlyUnimported = params.onlyUnimported !== "0";

  const items = await listBankReviewItems({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
    accountId: params.accountId,
    onlyUnimported,
    memberIds: context.members.map((member) => member.membershipId),
  });

  const scopeQuery = `householdId=${context.currentHouseholdId}&ledgerId=${context.currentLedgerId}`;

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">銀行明細レビュー</h1>
            <p className="text-sm text-foreground/70">自動候補を確認し、必要な修正後に取引登録します。</p>
          </div>
          <Link href={`/banking/transactions?${scopeQuery}`} className="text-sm text-primary underline underline-offset-2">
            明細一覧へ戻る
          </Link>
        </div>
      </Card>

      <BankingReviewClient
        householdId={context.currentHouseholdId}
        ledgerId={context.currentLedgerId}
        userId={context.userId}
        members={context.members}
        categories={context.categories}
        items={items}
      />
    </div>
  );
}
