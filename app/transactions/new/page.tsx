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

  if (!context.currentHouseholdId || !context.currentLedgerId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。管理者に確認してください。</p>;
  }

  const presets = await listPublishedPresets({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
  }).catch(() => []);

  return (
    <NewTransactionClient
      presets={presets}
      categories={context.categories}
      members={context.members}
    />
  );
}
