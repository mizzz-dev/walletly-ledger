import { describe, expect, it } from "vitest";
import { normalizeAccountingDateRange } from "@/lib/accounting/reporting-service";

describe("accounting reporting service", () => {
  it("期間指定を正規化できる", () => {
    const result = normalizeAccountingDateRange({
      dateFrom: "2026-01-01",
      dateTo: "2026-03-31",
    });

    expect(result.dateFrom).toBe("2026-01-01");
    expect(result.dateTo).toBe("2026-03-31");
  });

  it("開始日が終了日を超える場合はエラー", () => {
    expect(() =>
      normalizeAccountingDateRange({
        dateFrom: "2026-04-01",
        dateTo: "2026-03-31",
      }),
    ).toThrow("期間指定が不正");
  });
});
