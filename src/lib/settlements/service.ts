import { createSettlementRecord, listSettlementBaseRows } from "@/lib/repositories/settlement-repository";
import { aggregateMemberNetSummaries, buildSettlementSuggestions } from "@/lib/settlements/aggregation";

const to2 = (value: number) => Number(value.toFixed(2));

export const calculateSettlementData = async ({
  householdId,
  ledgerId,
  memberIds,
}: {
  householdId: string;
  ledgerId: string;
  memberIds: string[];
}) => {
  const rows = await listSettlementBaseRows({ householdId, ledgerId });
  const summaries = aggregateMemberNetSummaries({
    memberIds,
    transactions: rows.transactions.map((row) => ({
      payerMembershipId: row.payer_membership_id,
      amount: Number(row.amount),
      splits: (row.splits ?? []).map((split) => ({
        memberId: split.member_id,
        shareAmount: Number(split.share_amount),
      })),
    })),
    settlements: rows.settlements.map((row) => ({
      fromMemberId: row.from_membership_id,
      toMemberId: row.to_membership_id,
      amount: Number(row.amount),
    })),
  });

  const proposals = buildSettlementSuggestions(summaries).map((proposal) => ({
    ...proposal,
    amount: to2(proposal.amount),
  }));

  return { summaries, proposals };
};

export const validateSettlementRecordInput = ({
  fromMemberId,
  toMemberId,
  amount,
  validMemberIds,
}: {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  validMemberIds: string[];
}) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("精算金額は0より大きい値を入力してください");
  }

  if (fromMemberId === toMemberId) {
    throw new Error("同一メンバー間の精算は記録できません");
  }

  const validSet = new Set(validMemberIds);
  if (!validSet.has(fromMemberId) || !validSet.has(toMemberId)) {
    throw new Error("精算対象メンバーが世帯に存在しません");
  }
};

export const saveSettlementRecord = async ({
  householdId,
  ledgerId,
  fromMemberId,
  toMemberId,
  amount,
  method,
  note,
  settledOn,
  createdBy,
  validMemberIds,
}: {
  householdId: string;
  ledgerId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  method: string;
  note?: string;
  settledOn: string;
  createdBy: string;
  validMemberIds: string[];
}) => {
  validateSettlementRecordInput({ fromMemberId, toMemberId, amount, validMemberIds });

  await createSettlementRecord({
    household_id: householdId,
    ledger_id: ledgerId,
    from_membership_id: fromMemberId,
    to_membership_id: toMemberId,
    amount: to2(amount),
    method,
    note: note?.trim() ? note.trim() : null,
    settled_on: settledOn,
    created_by: createdBy,
  });
};
