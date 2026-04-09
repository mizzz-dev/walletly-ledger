import { AccountMaster, JournalDraft, LedgerType, TransactionDraft } from "@/types/domain";
import { findAccountByCode, suggestExpenseAccountCode, suggestPaymentAccountCode } from "@/lib/accounting/account-mapping";
import { suggestExpenseTaxCode } from "@/lib/accounting/tax-mapping";

interface DraftSourceInput {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  sourceType: JournalDraft["sourceType"];
  sourceReferenceId: string | null;
  amount: number;
  date: string;
  description: string;
  categoryName: string | null;
}

interface BuildJournalDraftParams {
  source: DraftSourceInput;
  accounts: AccountMaster[];
}

const createJournalDraftCore = ({ source, accounts }: BuildJournalDraftParams): JournalDraft => {
  if (source.ledgerType !== "work") {
    throw new Error("work台帳以外では会計仕訳ドラフトを作成できません");
  }

  if (source.amount <= 0) {
    throw new Error("仕訳ドラフトの金額が不正です");
  }

  const expenseCode = suggestExpenseAccountCode(source.categoryName);
  const paymentCode = suggestPaymentAccountCode(source.sourceType);
  const debitAccount = findAccountByCode(accounts, expenseCode);
  const creditAccount = findAccountByCode(accounts, paymentCode);

  const warnings: string[] = [];
  if (!debitAccount) {
    warnings.push(`借方候補の勘定科目(${expenseCode})が未設定です`);
  }
  if (!creditAccount) {
    warnings.push(`貸方候補の勘定科目(${paymentCode})が未設定です`);
  }

  return {
    householdId: source.householdId,
    ledgerId: source.ledgerId,
    sourceType: source.sourceType,
    sourceReferenceId: source.sourceReferenceId,
    journalDate: source.date,
    description: source.description,
    status: "draft",
    warnings,
    lines: [
      {
        lineNo: 1,
        accountId: debitAccount?.id ?? null,
        accountCode: debitAccount?.code ?? expenseCode,
        dc: "debit",
        amount: source.amount,
        taxCode: suggestExpenseTaxCode(source.categoryName),
        memo: null,
      },
      {
        lineNo: 2,
        accountId: creditAccount?.id ?? null,
        accountCode: creditAccount?.code ?? paymentCode,
        dc: "credit",
        amount: source.amount,
        taxCode: "OUT_OF_SCOPE",
        memo: null,
      },
    ],
  };
};

export const createJournalDraftFromTransaction = ({
  householdId,
  ledgerId,
  ledgerType,
  transactionId,
  amount,
  transactionDate,
  merchant,
  note,
  categoryName,
  sourceType,
  accounts,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  transactionId: string;
  amount: number;
  transactionDate: string;
  merchant: string | null;
  note: string | null;
  categoryName: string | null;
  sourceType: "manual" | "ocr" | "bank" | null;
  accounts: AccountMaster[];
}): JournalDraft => {
  const description = [merchant, note].filter(Boolean).join(" / ") || "取引起点の仕訳ドラフト";

  return createJournalDraftCore({
    source: {
      householdId,
      ledgerId,
      ledgerType,
      sourceType: sourceType ?? "transaction",
      sourceReferenceId: transactionId,
      amount,
      date: transactionDate,
      description,
      categoryName,
    },
    accounts,
  });
};

export const createJournalDraftFromTransactionDraft = ({
  draft,
  ledgerType,
  accounts,
}: {
  draft: TransactionDraft;
  ledgerType: LedgerType;
  accounts: AccountMaster[];
}): JournalDraft => {
  if (!draft.amount || !draft.date) {
    throw new Error("transaction draftから仕訳ドラフトを作るには金額と日付が必要です");
  }

  return createJournalDraftCore({
    source: {
      householdId: draft.householdId,
      ledgerId: draft.ledgerId,
      ledgerType,
      sourceType: draft.sourceType,
      sourceReferenceId: draft.bankTransactionId ?? draft.receiptAttachmentId,
      amount: draft.amount,
      date: draft.date,
      description: draft.merchant ?? draft.note ?? "取込ドラフト起点の仕訳",
      categoryName: null,
    },
    accounts,
  });
};
