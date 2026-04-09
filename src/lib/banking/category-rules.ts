export interface BankCategoryRule {
  categoryId: string;
  keywords: string[];
  merchantIncludes?: string[];
}

export const DEFAULT_BANK_CATEGORY_RULES: BankCategoryRule[] = [
  {
    categoryId: "food",
    keywords: ["スーパー", "コンビニ", "cafe", "ランチ", "飲食"],
    merchantIncludes: ["mart", "store", "キッチン"],
  },
  {
    categoryId: "transport",
    keywords: ["jr", "地下鉄", "バス", "taxi", "高速"],
    merchantIncludes: ["交通", "rail"],
  },
  {
    categoryId: "utilities",
    keywords: ["電気", "ガス", "水道", "通信", "携帯"],
    merchantIncludes: ["電力", "gas", "mobile"],
  },
];
