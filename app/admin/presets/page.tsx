import { resolveAppContext } from "@/lib/context/app-context";
import { listAdminPresets } from "@/lib/preset-service";
import { PresetsAdminClient } from "./presets-admin-client";

export default async function PresetsPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯がありません。管理者に確認してください。</p>;
  }

  const presets = await listAdminPresets({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
  }).catch(() => []);

  return (
    <PresetsAdminClient
      initialPresets={presets}
      categories={context.categories}
      members={context.members}
      householdId={context.currentHouseholdId}
      ledgerId={context.currentLedgerId}
      userId={context.userId}
    />
  );
}
