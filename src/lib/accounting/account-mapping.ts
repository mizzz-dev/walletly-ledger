import { AccountMaster } from "@/types/domain";

const expenseRules: Array<{ keywords: string[]; accountCode: string }> = [
  { keywords: ["交通", "旅費"], accountCode: "621" },
  { keywords: ["通信", "サーバー", "SaaS", "ソフト"], accountCode: "631" },
  { keywords: ["会議", "交際", "飲食"], accountCode: "641" },
  { keywords: ["水道", "電気", "ガス"], accountCode: "651" },
];

const BANK_SOURCE_TYPES = new Set(["bank"]);

export const suggestExpenseAccountCode = (categoryName: string | null): string => {
  if (!categoryName) {
    return "611";
  }

  const matchedRule = expenseRules.find((rule) => rule.keywords.some((keyword) => categoryName.includes(keyword)));
  return matchedRule?.accountCode ?? "611";
};

export const suggestPaymentAccountCode = (sourceType: string | null): string => {
  if (sourceType && BANK_SOURCE_TYPES.has(sourceType)) {
    return "111";
  }
  return "101";
};

export const findAccountByCode = (accounts: AccountMaster[], accountCode: string): AccountMaster | null => {
  return accounts.find((account) => account.code === accountCode && account.isActive) ?? null;
};
