import { createHash } from "node:crypto";

export interface BankTransactionHashInput {
  provider: string;
  providerAccountId: string;
  providerTransactionId: string | null;
  postedAt: string;
  amount: number;
  currency: string;
  description: string;
  counterparty: string | null;
}

export const buildBankTransactionHash = (input: BankTransactionHashInput): string => {
  const canonical = [
    input.provider,
    input.providerAccountId,
    input.providerTransactionId ?? "",
    input.postedAt,
    input.amount.toFixed(2),
    input.currency,
    input.description.trim(),
    input.counterparty?.trim() ?? "",
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex");
};
