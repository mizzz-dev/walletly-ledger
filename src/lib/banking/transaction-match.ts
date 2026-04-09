import { TransactionDraft, TransactionMatchCandidate, TransactionMatchResult } from "@/types/domain";

const DAY = 1000 * 60 * 60 * 24;

const normalize = (value: string | null | undefined) => (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();

const dateDiffDays = (left: string, right: string) => {
  const leftMs = Date.parse(left);
  const rightMs = Date.parse(right);
  if (Number.isNaN(leftMs) || Number.isNaN(rightMs)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.abs(leftMs - rightMs) / DAY;
};

export const matchTransactionDraft = ({
  draft,
  candidates,
}: {
  draft: TransactionDraft;
  candidates: TransactionMatchCandidate[];
}): TransactionMatchResult => {
  if (!draft.amount || !draft.date) {
    return { level: "none", transactionId: null, reason: "金額または日付が不足しています" };
  }

  const merchant = normalize(draft.merchant);
  const note = normalize(draft.note);

  for (const candidate of candidates) {
    if (candidate.importedBankTransactionId && draft.bankTransactionId && candidate.importedBankTransactionId === draft.bankTransactionId) {
      return { level: "exact", transactionId: candidate.transactionId, reason: "同じ銀行明細IDで登録済みです" };
    }

    const amountSame = Math.abs(candidate.amount - draft.amount) < 0.01;
    const dayDiff = dateDiffDays(candidate.date, draft.date);
    const candidateMerchant = normalize(candidate.merchant);
    const candidateNote = normalize(candidate.note);

    if (amountSame && dayDiff === 0 && merchant && candidateMerchant && merchant === candidateMerchant) {
      return { level: "exact", transactionId: candidate.transactionId, reason: "金額・日付・店舗名が一致します" };
    }

    const merchantNear = merchant && candidateMerchant && (candidateMerchant.includes(merchant) || merchant.includes(candidateMerchant));
    const noteNear = note && candidateNote && (candidateNote.includes(note) || note.includes(candidateNote));

    if (amountSame && dayDiff <= 3 && (merchantNear || noteNear)) {
      return { level: "probable", transactionId: candidate.transactionId, reason: "近い日付の類似取引が存在します" };
    }
  }

  return { level: "none", transactionId: null, reason: null };
};
