import { DEFAULT_BANK_CATEGORY_RULES } from "@/lib/banking/category-rules";
import { CategoryHistoryHint, suggestCategoryFromDraft } from "@/lib/banking/category-matcher";
import { findApplicablePreset } from "@/lib/preset-matcher";
import { previewPresetSplit } from "@/lib/preset-preview";
import { matchTransactionDraft } from "@/lib/banking/transaction-match";
import {
  BankingReviewItem,
  CategoryOption,
  CategorySplitPreset,
  TransactionDraft,
  TransactionMatchCandidate,
} from "@/types/domain";

export const enrichBankDraftForReview = ({
  bankTransactionId,
  accountDisplayName,
  direction,
  matchStatus,
  draft,
  categories,
  presets,
  memberIds,
  history,
  transactions,
}: {
  bankTransactionId: string;
  accountDisplayName: string;
  direction: "inflow" | "outflow";
  matchStatus: "pending" | "imported" | "skipped";
  draft: TransactionDraft;
  categories: CategoryOption[];
  presets: CategorySplitPreset[];
  memberIds: string[];
  history: CategoryHistoryHint[];
  transactions: TransactionMatchCandidate[];
}): BankingReviewItem => {
  const categorySuggestion = suggestCategoryFromDraft({
    draft,
    categories,
    rules: DEFAULT_BANK_CATEGORY_RULES,
    history,
  });

  const draftWithCategory: TransactionDraft = {
    ...draft,
    suggestedCategoryId: categorySuggestion.categoryId,
    confidence: categorySuggestion.confidence ?? draft.confidence,
  };

  const preset = categorySuggestion.categoryId
    ? findApplicablePreset(presets, {
        categoryId: categorySuggestion.categoryId,
        amount: draft.amount ?? 0,
        merchantName: draft.merchant ?? "",
        note: draft.note ?? "",
        transactionDate: draft.date ?? new Date().toISOString().slice(0, 10),
      })
    : undefined;

  const splitPreview = draft.amount && preset
    ? previewPresetSplit({ amount: draft.amount, preset, memberIds })
    : [];

  const matchResult = matchTransactionDraft({ draft: draftWithCategory, candidates: transactions });

  return {
    bankTransactionId,
    accountDisplayName,
    direction,
    matchStatus,
    draft: {
      ...draftWithCategory,
      suggestedPresetId: preset?.id ?? null,
      suggestedMemberIds: splitPreview.map((row) => row.memberId),
    },
    categorySuggestion,
    presetId: preset?.id ?? null,
    splitPreview,
    matchResult,
  };
};
