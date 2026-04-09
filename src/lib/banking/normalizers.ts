import { buildBankTransactionHash } from "@/lib/banking/hash";
import { ProviderAccount, ProviderTransaction } from "@/lib/banking/providers/types";
import { BankConnection } from "@/types/domain";

export interface NormalizedBankTransactionInput {
  connection: BankConnection;
  account: ProviderAccount;
  transaction: ProviderTransaction;
}

export interface NormalizedBankTransaction {
  household_id: string;
  ledger_id: string | null;
  provider_transaction_id: string | null;
  posted_at: string;
  booked_at: string | null;
  amount: number;
  currency: string;
  direction: "inflow" | "outflow";
  description: string;
  counterparty: string | null;
  raw_payload: Record<string, unknown>;
  transaction_hash: string;
}

const to2 = (value: number) => Number(value.toFixed(2));

export const normalizeProviderTransaction = ({ connection, account, transaction }: NormalizedBankTransactionInput): NormalizedBankTransaction => {
  if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) {
    throw new Error("銀行明細の金額が不正です");
  }

  if (!transaction.description?.trim()) {
    throw new Error("銀行明細の摘要が不足しています");
  }

  if (!transaction.postedAt || Number.isNaN(Date.parse(transaction.postedAt))) {
    throw new Error("銀行明細の日付が不正です");
  }

  const amount = to2(transaction.amount);

  return {
    household_id: connection.householdId,
    ledger_id: connection.ledgerId,
    provider_transaction_id: transaction.providerTransactionId,
    posted_at: transaction.postedAt,
    booked_at: transaction.bookedAt,
    amount,
    currency: transaction.currency || account.currency,
    direction: transaction.direction,
    description: transaction.description.trim(),
    counterparty: transaction.counterparty?.trim() || null,
    raw_payload: transaction.rawPayload,
    transaction_hash: buildBankTransactionHash({
      provider: connection.provider,
      providerAccountId: account.providerAccountId,
      providerTransactionId: transaction.providerTransactionId,
      postedAt: transaction.postedAt,
      amount,
      currency: transaction.currency || account.currency,
      description: transaction.description,
      counterparty: transaction.counterparty,
    }),
  };
};
