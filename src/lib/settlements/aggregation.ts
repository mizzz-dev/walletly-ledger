import { suggestSettlements } from "@/lib/settlement";

export interface MemberNetSummary {
  memberId: string;
  paid: number;
  owed: number;
  net: number;
}

export interface TxForAggregation {
  payerMembershipId: string;
  amount: number;
  splits: Array<{ memberId: string; shareAmount: number }>;
}

export interface SettlementRecordForAggregation {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

const to2 = (value: number) => Number(value.toFixed(2));

export const aggregateMemberNetSummaries = ({
  memberIds,
  transactions,
  settlements,
}: {
  memberIds: string[];
  transactions: TxForAggregation[];
  settlements: SettlementRecordForAggregation[];
}): MemberNetSummary[] => {
  const map = new Map<string, MemberNetSummary>(
    memberIds.map((memberId) => [memberId, { memberId, paid: 0, owed: 0, net: 0 }]),
  );

  transactions.forEach((transaction) => {
    const payer = map.get(transaction.payerMembershipId);
    if (payer) {
      payer.paid = to2(payer.paid + transaction.amount);
    }

    transaction.splits.forEach((split) => {
      const target = map.get(split.memberId);
      if (target) {
        target.owed = to2(target.owed + split.shareAmount);
      }
    });
  });

  settlements.forEach((settlement) => {
    const from = map.get(settlement.fromMemberId);
    const to = map.get(settlement.toMemberId);
    if (from) {
      from.net = to2(from.net + settlement.amount);
    }
    if (to) {
      to.net = to2(to.net - settlement.amount);
    }
  });

  return Array.from(map.values()).map((summary) => ({
    ...summary,
    net: to2(summary.paid - summary.owed + summary.net),
  }));
};

export const buildSettlementSuggestions = (summaries: MemberNetSummary[]) => {
  return suggestSettlements(
    summaries.map((summary) => ({
      memberId: summary.memberId,
      paid: summary.net > 0 ? summary.net : 0,
      burden: summary.net < 0 ? Math.abs(summary.net) : 0,
    })),
  );
};
