import { calculateJournalBalance } from "@/lib/accounting/journal-balance";
import { createJournalDraftFromTransaction } from "@/lib/accounting/journal-draft";
import { listAccountsByLedger, listJournalsByLedger, listTransactionsForJournalDraft, createJournalWithLines } from "@/lib/accounting/repositories/accounting-repository";
import { isSupportedTaxCode } from "@/lib/accounting/tax-mapping";
import { LedgerType } from "@/types/domain";

export const listLedgerJournals = async ({ householdId, ledgerId, ledgerType }: { householdId: string; ledgerId: string; ledgerType: LedgerType }) => {
  if (ledgerType !== "work") {
    return [];
  }
  return listJournalsByLedger({ householdId, ledgerId });
};

export const buildDraftFromTransaction = async ({
  householdId,
  ledgerId,
  ledgerType,
  transactionId,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  transactionId: string;
}) => {
  if (ledgerType !== "work") {
    throw new Error("work台帳以外では会計モードを利用できません");
  }

  const [accounts, transactions] = await Promise.all([
    listAccountsByLedger({ householdId, ledgerId }),
    listTransactionsForJournalDraft({ householdId, ledgerId }),
  ]);

  const transaction = transactions.find((item) => item.id === transactionId);
  if (!transaction) {
    throw new Error("指定した取引が見つかりませんでした");
  }

  const draft = createJournalDraftFromTransaction({
    householdId,
    ledgerId,
    ledgerType,
    transactionId: transaction.id,
    amount: transaction.amount,
    transactionDate: transaction.transactionDate,
    merchant: transaction.merchant,
    note: transaction.note,
    categoryName: transaction.categoryName,
    sourceType: transaction.sourceType,
    accounts,
  });

  return { draft, accounts, transactionOptions: transactions };
};

export const listTransactionOptionsForDraft = async ({ householdId, ledgerId }: { householdId: string; ledgerId: string }) => {
  return listTransactionsForJournalDraft({ householdId, ledgerId });
};

export const saveJournalDraft = async ({
  householdId,
  ledgerId,
  ledgerType,
  createdBy,
  sourceType,
  sourceReferenceId,
  journalDate,
  description,
  debitAccountId,
  debitAmount,
  debitTaxCode,
  creditAccountId,
  creditAmount,
  creditTaxCode,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  createdBy: string;
  sourceType: "manual" | "transaction" | "bank" | "ocr";
  sourceReferenceId: string | null;
  journalDate: string;
  description: string;
  debitAccountId: string;
  debitAmount: number;
  debitTaxCode: string | null;
  creditAccountId: string;
  creditAmount: number;
  creditTaxCode: string | null;
}) => {
  if (ledgerType !== "work") {
    throw new Error("work台帳以外では仕訳を作成できません");
  }

  if (!debitAccountId || !creditAccountId) {
    throw new Error("勘定科目が未設定です");
  }

  if (!isSupportedTaxCode(debitTaxCode) || !isSupportedTaxCode(creditTaxCode)) {
    throw new Error("税区分が不正です");
  }

  const balance = calculateJournalBalance([
    { dc: "debit", amount: debitAmount },
    { dc: "credit", amount: creditAmount },
  ]);

  if (!balance.isBalanced) {
    throw new Error("貸借が一致していません");
  }

  return createJournalWithLines({
    journal: {
      household_id: householdId,
      ledger_id: ledgerId,
      source_type: sourceType,
      source_reference_id: sourceReferenceId,
      journal_date: journalDate,
      description,
      status: "draft",
      created_by: createdBy,
    },
    lines: [
      {
        line_no: 1,
        account_id: debitAccountId,
        dc: "debit",
        amount: debitAmount,
        tax_code: debitTaxCode,
        memo: null,
      },
      {
        line_no: 2,
        account_id: creditAccountId,
        dc: "credit",
        amount: creditAmount,
        tax_code: creditTaxCode,
        memo: null,
      },
    ],
  });
};
