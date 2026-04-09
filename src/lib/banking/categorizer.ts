import { DEFAULT_BANK_CATEGORY_RULES } from "@/lib/banking/category-rules";
import { CategoryHistoryHint, suggestCategoryFromDraft } from "@/lib/banking/category-matcher";
import { CategoryOption, CategorySuggestion, TransactionDraft } from "@/types/domain";

export const categorizeBankDraft = ({
  draft,
  categories,
  history,
}: {
  draft: TransactionDraft;
  categories: CategoryOption[];
  history: CategoryHistoryHint[];
}): CategorySuggestion => {
  return suggestCategoryFromDraft({
    draft,
    categories,
    rules: DEFAULT_BANK_CATEGORY_RULES,
    history,
  });
};
