import { CategoryOption, CategorySuggestion, TransactionDraft } from "@/types/domain";
import { BankCategoryRule } from "@/lib/banking/category-rules";

export interface CategoryHistoryHint {
  merchant: string;
  note: string | null;
  categoryId: string;
}

const normalize = (value: string | null | undefined) => (value ?? "").toLowerCase().trim();

const includesAny = (text: string, keywords: string[]) => keywords.some((keyword) => text.includes(keyword.toLowerCase()));

export const suggestCategoryFromDraft = ({
  draft,
  categories,
  rules,
  history,
}: {
  draft: TransactionDraft;
  categories: CategoryOption[];
  rules: BankCategoryRule[];
  history: CategoryHistoryHint[];
}): CategorySuggestion => {
  const merchant = normalize(draft.merchant);
  const note = normalize(draft.note);
  const combined = `${merchant} ${note}`.trim();

  if (!combined) {
    return { categoryId: null, confidence: null, reason: "none" };
  }

  for (const rule of rules) {
    const byKeyword = includesAny(combined, rule.keywords);
    const byMerchant = rule.merchantIncludes ? includesAny(merchant, rule.merchantIncludes) : false;
    if (byKeyword || byMerchant) {
      const resolved = categories.find(
        (category) => category.id === rule.categoryId || normalize(category.name) === normalize(rule.categoryId),
      );
      if (resolved) {
        return { categoryId: resolved.id, confidence: 0.88, reason: "rule" };
      }
    }
  }

  const historyHit = history.find((item) => {
    const base = `${normalize(item.merchant)} ${normalize(item.note)}`;
    return !!base && (merchant.includes(normalize(item.merchant)) || base.includes(merchant) || note.includes(normalize(item.note)));
  });

  if (historyHit) {
    return { categoryId: historyHit.categoryId, confidence: 0.74, reason: "history" };
  }

  const nameHit = categories.find((category) => combined.includes(normalize(category.name)));
  if (nameHit) {
    return { categoryId: nameHit.id, confidence: 0.58, reason: "name" };
  }

  return { categoryId: null, confidence: 0.2, reason: "none" };
};
