import { BankTransaction, TransactionDraft } from "@/types/domain";

const sanitizeText = (value: string | null | undefined): string | null => {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeMerchantFromBankTransaction = ({
  counterparty,
  description,
}: {
  counterparty: string | null;
  description: string;
}): string | null => {
  const direct = sanitizeText(counterparty);
  if (direct) {
    return direct;
  }

  const normalized = description
    .replace(/[【】\[\]<>「」]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return null;
  }

  const head = normalized.split("/")[0]?.trim() ?? normalized;
  return head.slice(0, 80);
};

export const createTransactionDraftFromBankTransaction = ({
  bankTransaction,
  householdId,
  ledgerId,
}: {
  bankTransaction: Pick<BankTransaction, "id" | "postedAt" | "amount" | "description" | "counterparty" | "direction">;
  householdId: string;
  ledgerId: string;
}): TransactionDraft => {
  const warnings: string[] = [];

  if (bankTransaction.direction !== "outflow") {
    warnings.push("支出以外の明細のため、自動登録対象外です");
  }

  const amount = Number.isFinite(bankTransaction.amount) && bankTransaction.amount > 0 ? bankTransaction.amount : null;
  if (!amount) {
    warnings.push("金額が不正なため確認が必要です");
  }

  const merchant = normalizeMerchantFromBankTransaction({
    counterparty: bankTransaction.counterparty,
    description: bankTransaction.description,
  });

  if (!merchant) {
    warnings.push("店舗名候補を抽出できませんでした");
  }

  return {
    sourceType: "bank",
    householdId,
    ledgerId,
    amount,
    date: bankTransaction.postedAt,
    merchant,
    note: sanitizeText(bankTransaction.description),
    suggestedCategoryId: null,
    suggestedPresetId: null,
    suggestedMemberIds: null,
    bankTransactionId: bankTransaction.id,
    receiptAttachmentId: null,
    confidence: merchant ? 0.7 : 0.45,
    warnings,
  };
};
