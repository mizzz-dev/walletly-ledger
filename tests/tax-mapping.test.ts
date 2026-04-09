import { describe, expect, it } from "vitest";
import { isSupportedTaxCode, suggestExpenseTaxCode } from "@/lib/accounting/tax-mapping";

describe("tax mapping", () => {
  it("軽減税率キーワードは仕入8%を返す", () => {
    expect(suggestExpenseTaxCode("食品")).toBe("INPUT_8");
  });

  it("通常カテゴリは仕入10%を返す", () => {
    expect(suggestExpenseTaxCode("備品")).toBe("INPUT_10");
  });

  it("未対応の税区分を弾ける", () => {
    expect(isSupportedTaxCode("UNKNOWN")).toBe(false);
    expect(isSupportedTaxCode("OUT_OF_SCOPE")).toBe(true);
  });
});
