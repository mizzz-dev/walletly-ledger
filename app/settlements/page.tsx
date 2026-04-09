import { Card } from "@/components/ui/card";
import { resolveAppContext } from "@/lib/context/app-context";
import { generateSettlementReminderNotifications } from "@/lib/notifications/service";
import { calculateSettlementData } from "@/lib/settlements/service";
import { SettlementsClient } from "./settlements-client";

export default async function SettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId || !context.userId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  try {
    await generateSettlementReminderNotifications({
      householdId: context.currentHouseholdId,
      ledgerId: context.currentLedgerId,
      memberIds: context.members.map((member) => member.membershipId),
    });

    const result = await calculateSettlementData({
      householdId: context.currentHouseholdId,
      ledgerId: context.currentLedgerId,
      memberIds: context.members.map((member) => member.membershipId),
    });

    const memberNameMap = Object.fromEntries(context.members.map((member) => [member.membershipId, member.name]));

    return (
      <SettlementsClient
        summaries={result.summaries.map((summary) => ({
          ...summary,
          memberName: memberNameMap[summary.memberId] ?? summary.memberId,
        }))}
        proposals={result.proposals}
        householdId={context.currentHouseholdId}
        ledgerId={context.currentLedgerId}
        createdBy={context.userId}
        memberNameMap={memberNameMap}
        validMemberIds={context.members.map((member) => member.membershipId)}
      />
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "清算データの取得に失敗しました";
    return (
      <Card>
        <h1 className="text-xl font-bold">清算提案</h1>
        <p className="mt-3 text-sm text-rose-600">{message}</p>
      </Card>
    );
  }
}
