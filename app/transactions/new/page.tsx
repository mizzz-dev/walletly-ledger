import { resolveAppContext } from "@/lib/context/app-context";
import { listPublishedPresets } from "@/lib/preset-service";
import { NewTransactionClient } from "./transaction-form-client";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId || !context.userId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。管理者に確認してください。</p>;
  }

  const presets = await listPublishedPresets({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
  }).catch(() => []);

  const currentLedger = context.ledgers.find((ledger) => ledger.id === context.currentLedgerId);

  return (
    <NewTransactionClient
      presets={presets}
      categories={context.categories}
      members={context.members}
      householdId={context.currentHouseholdId}
      ledgerId={context.currentLedgerId}
      userId={context.userId}
      currency={currentLedger?.currency ?? "JPY"}
    />
  );
}
