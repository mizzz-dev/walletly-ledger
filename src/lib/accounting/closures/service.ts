import { toMonthlyPeriod } from "@/lib/accounting/closures/period";
import { listClosuresByLedger, upsertPeriodClosure } from "@/lib/accounting/closures/repository";
import { writeAuditLog } from "@/lib/audit/service";
import { getLedgerById } from "@/lib/ledgers/service";

export const listLedgerClosures = async ({ householdId, ledgerId }: { householdId: string; ledgerId: string }) => {
  return listClosuresByLedger({ householdId, ledgerId });
};

export const validateCloseLedgerRequest = ({ ledgerType, actorUserId }: { ledgerType: "family" | "work" | "custom"; actorUserId: string }) => {
  if (!actorUserId) {
    throw new Error("実行ユーザーが不正です");
  }

  if (ledgerType !== "work") {
    throw new Error("月次締めはwork台帳でのみ実行できます");
  }
};

export const closeLedgerMonthlyPeriod = async ({
  householdId,
  ledgerId,
  actorUserId,
  period,
  note,
}: {
  householdId: string;
  ledgerId: string;
  actorUserId: string;
  period: string;
  note?: string;
}) => {
  const ledger = await getLedgerById({ householdId, ledgerId });
  validateCloseLedgerRequest({ ledgerType: ledger?.type ?? "family", actorUserId });

  const monthlyPeriod = toMonthlyPeriod(period);

  const closure = await upsertPeriodClosure({
    householdId,
    ledgerId,
    periodStart: monthlyPeriod.periodStart,
    periodEnd: monthlyPeriod.periodEnd,
    actorUserId,
    note,
  });

  await writeAuditLog({
    householdId,
    ledgerId,
    actorUserId,
    entityType: "closure",
    entityId: closure.id,
    action: "close_period",
    beforeJson: null,
    afterJson: {
      period: monthlyPeriod.period,
      status: closure.status,
      periodStart: closure.periodStart,
      periodEnd: closure.periodEnd,
    },
    metadataJson: {
      note: note ?? null,
    },
  });

  return closure;
};
