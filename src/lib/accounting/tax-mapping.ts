import { TaxCode } from "@/types/domain";

export const DEFAULT_TAX_CODES: TaxCode[] = [
  { code: "OUT_OF_SCOPE", label: "対象外", rate: 0, isInput: false },
  { code: "EXEMPT", label: "非課税", rate: 0, isInput: false },
  { code: "TAXABLE_10", label: "課税10%", rate: 0.1, isInput: false },
  { code: "TAXABLE_8", label: "課税8%", rate: 0.08, isInput: false },
  { code: "INPUT_10", label: "仕入10%", rate: 0.1, isInput: true },
  { code: "INPUT_8", label: "仕入8%", rate: 0.08, isInput: true },
];

const reducedRateKeywords = ["食品", "食材", "弁当", "飲料"];

export const resolveTaxCodeLabel = (code: string | null): string => {
  if (!code) {
    return "-";
  }
  return DEFAULT_TAX_CODES.find((item) => item.code === code)?.label ?? code;
};

export const isSupportedTaxCode = (code: string | null): boolean => {
  if (!code) {
    return true;
  }
  return DEFAULT_TAX_CODES.some((item) => item.code === code);
};

export const suggestExpenseTaxCode = (categoryName: string | null): string => {
  if (!categoryName) {
    return "INPUT_10";
  }

  if (reducedRateKeywords.some((keyword) => categoryName.includes(keyword))) {
    return "INPUT_8";
  }

  return "INPUT_10";
};
