import { SplitResult, TransactionSourceType } from "@/types/domain";

export interface CreateTransactionInput {
  householdId: string;
  ledgerId: string;
  payerMembershipId: string;
  categoryId: string;
  amount: number;
  currency: string;
  note?: string;
  merchant?: string;
  transactionDate: string;
  createdBy: string;
  appliedPresetId?: string | null;
  splitResults: SplitResult[];
  validMemberIds: string[];
  receiptAttachmentId?: string | null;
  importedBankTransactionId?: string | null;
  sourceType?: TransactionSourceType;
  sourceReferenceId?: string | null;
}

export interface TransactionInsertPayload {
  household_id: string;
  ledger_id: string;
  payer_membership_id: string;
  category_id: string;
  amount: number;
  currency: string;
  note: string | null;
  merchant: string | null;
  transaction_date: string;
  applied_preset_id: string | null;
  created_by: string;
  imported_bank_transaction_id: string | null;
  source_type: TransactionSourceType;
  source_reference_id: string | null;
}

export interface SplitInsertPayload {
  household_id: string;
  ledger_id: string;
  transaction_id: string;
  membership_id: string;
  member_id: string;
  amount: number;
  share_amount: number;
  method: string;
  rule_payload: Record<string, never>;
}

const to2 = (value: number) => Number(value.toFixed(2));

const validateAmount = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("金額は0より大きい値を入力してください");
  }
};

const validateTransactionDate = (date: string) => {
  if (!date || Number.isNaN(Date.parse(date))) {
    throw new Error("日付が不正です");
  }
};

const assertMemberIds = (splitResults: SplitResult[], validMemberIds: string[]) => {
  const validSet = new Set(validMemberIds);
  if (splitResults.some((result) => !validSet.has(result.memberId))) {
    throw new Error("分担対象メンバーが不正です");
  }
};

const assertSplitSum = (amount: number, splitResults: SplitResult[]) => {
  const splitSum = to2(splitResults.reduce((sum, split) => sum + split.amount, 0));
  if (to2(amount) !== splitSum) {
    throw new Error("分担金額の合計が支出金額と一致しません");
  }
};

export const toTransactionInsertPayload = (input: CreateTransactionInput): TransactionInsertPayload => {
  validateAmount(input.amount);
  validateTransactionDate(input.transactionDate);

  if (!input.validMemberIds.includes(input.payerMembershipId)) {
    throw new Error("支払者が世帯メンバーに含まれていません");
  }

  if (input.splitResults.length === 0) {
    throw new Error("分担メンバーを1人以上指定してください");
  }

  assertMemberIds(input.splitResults, input.validMemberIds);
  assertSplitSum(input.amount, input.splitResults);

  return {
    household_id: input.householdId,
    ledger_id: input.ledgerId,
    payer_membership_id: input.payerMembershipId,
    category_id: input.categoryId,
    amount: to2(input.amount),
    currency: input.currency,
    note: input.note?.trim() ? input.note.trim() : null,
    merchant: input.merchant?.trim() ? input.merchant.trim() : null,
    transaction_date: input.transactionDate,
    applied_preset_id: input.appliedPresetId ?? null,
    created_by: input.createdBy,
    imported_bank_transaction_id: input.importedBankTransactionId ?? null,
    source_type: input.sourceType ?? "manual",
    source_reference_id: input.sourceReferenceId ?? null,
  };
};

export const toSplitInsertPayloads = ({
  householdId,
  ledgerId,
  transactionId,
  splitResults,
}: {
  householdId: string;
  ledgerId: string;
  transactionId: string;
  splitResults: SplitResult[];
}): SplitInsertPayload[] => {
  return splitResults.map((split) => {
    validateAmount(split.amount);
    return {
      household_id: householdId,
      ledger_id: ledgerId,
      transaction_id: transactionId,
      membership_id: split.memberId,
      member_id: split.memberId,
      amount: to2(split.amount),
      share_amount: to2(split.amount),
      method: "manual",
      rule_payload: {},
    };
  });
};
