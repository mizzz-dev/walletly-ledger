import { BankTransactionDraft, ImportedTransactionCandidate } from "@/types/domain";

interface CandidateInput {
  id: string;
  amount: number;
  postedAt: string;
  description: string;
  counterparty: string | null;
  direction: "inflow" | "outflow";
  importedTransactionId: string | null;
}

export const toImportedTransactionCandidate = (input: CandidateInput): ImportedTransactionCandidate => {
  const suggestedMerchant = input.counterparty?.trim() || input.description.slice(0, 80);
  return {
    bankTransactionId: input.id,
    suggestedAmount: input.amount,
    suggestedDate: input.postedAt,
    suggestedMerchant,
    suggestedNote: input.description,
    suggestedCategoryId: null,
    matchStatus: input.importedTransactionId ? "imported" : "pending",
    confidence: input.counterparty ? 0.8 : 0.6,
  };
};

export const toBankTransactionDraft = (candidate: ImportedTransactionCandidate): BankTransactionDraft => {
  return {
    amount: candidate.suggestedAmount,
    transactionDate: candidate.suggestedDate,
    merchantName: candidate.suggestedMerchant,
    noteCandidate: candidate.suggestedNote,
    categorySuggestion: candidate.suggestedCategoryId,
    importedBankTransactionId: candidate.bankTransactionId,
  };
};

export const inferDirectionFromSignedAmount = (value: number): "inflow" | "outflow" => {
  if (!Number.isFinite(value) || value === 0) {
    throw new Error("金額の符号から入出金方向を判定できません");
  }
  return value > 0 ? "outflow" : "inflow";
};
