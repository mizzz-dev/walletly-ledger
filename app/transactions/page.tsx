import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/table";
import { resolveAppContext } from "@/lib/context/app-context";
import { listTransactionItems } from "@/lib/transaction-service";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  try {
    const items = await listTransactionItems({
      householdId: context.currentHouseholdId,
      ledgerId: context.currentLedgerId,
    });

    return (
      <Card className="space-y-4">
        <h1 className="text-xl font-bold">取引一覧</h1>
        {items.length === 0 ? (
          <p className="text-sm text-foreground/70">まだ取引がありません。支出追加から登録してください。</p>
        ) : (
          <SimpleTable
            headers={["日付", "カテゴリ", "金額", "支払者", "メモ", "適用プリセット"]}
            rows={items.map((item) => [
              item.date,
              item.categoryName,
              <span key={`${item.id}-amount`} className="font-semibold tabular-nums">¥{item.amount.toLocaleString()}</span>,
              item.payerName,
              item.note || "-",
              item.presetName ?? "-",
            ])}
          />
        )}
      </Card>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "取引一覧の取得に失敗しました";
    return (
      <Card>
        <h1 className="text-xl font-bold">取引一覧</h1>
        <p className="mt-3 text-sm text-rose-600">{message}</p>
      </Card>
    );
  }
}
