import { JournalLineDraft } from "@/types/domain";

export interface JournalBalanceResult {
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

export const calculateJournalBalance = (lines: Pick<JournalLineDraft, "dc" | "amount">[]): JournalBalanceResult => {
  const totalDebit = lines
    .filter((line) => line.dc === "debit")
    .reduce((sum, line) => sum + line.amount, 0);
  const totalCredit = lines
    .filter((line) => line.dc === "credit")
    .reduce((sum, line) => sum + line.amount, 0);

  return {
    totalDebit,
    totalCredit,
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.0001,
  };
};
