import { listClosedClosuresByLedger } from "@/lib/accounting/closures/repository";
import { findClosedPeriodByDate, toPeriodLabel } from "@/lib/accounting/closures/period";
import { getLedgerById } from "@/lib/ledgers/service";

export const buildClosedPeriodErrorMessage = ({ operationLabel, periodStart }: { operationLabel: string; periodStart: string }) => `${operationLabel}は締め済み期間（${toPeriodLabel(periodStart)}）のため実行できません`;

export const assertEditableByClosures = ({
  date,
  operationLabel,
  closures,
}: {
  date: string;
  operationLabel: string;
  closures: Awaited<ReturnType<typeof listClosedClosuresByLedger>>;
}) => {
  const blocked = findClosedPeriodByDate({ closures, date });
  if (blocked) {
    throw new Error(buildClosedPeriodErrorMessage({ operationLabel, periodStart: blocked.periodStart }));
  }
};

export const assertLedgerPeriodEditableIfWork = async ({
  householdId,
  ledgerId,
  date,
  operationLabel,
}: {
  householdId: string;
  ledgerId: string;
  date: string;
  operationLabel: string;
}) => {
  const ledger = await getLedgerById({ householdId, ledgerId });
  if (!ledger || ledger.type !== "work") {
    return;
  }

  const closures = await listClosedClosuresByLedger({ householdId, ledgerId });
  assertEditableByClosures({ date, operationLabel, closures });
};
