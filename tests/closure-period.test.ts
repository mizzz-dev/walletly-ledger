import { describe, expect, test } from "vitest";
import { findClosedPeriodByDate, isDateWithinPeriod, toMonthlyPeriod } from "@/lib/accounting/closures/period";

describe("closure period", () => {
  test("YYYY-MMから月初月末を生成できる", () => {
    expect(toMonthlyPeriod("2026-02")).toEqual({
      period: "2026-02",
      periodStart: "2026-02-01",
      periodEnd: "2026-02-28",
    });
  });

  test("不正なperiodを拒否する", () => {
    expect(() => toMonthlyPeriod("2026/02")).toThrowError("対象月はYYYY-MM形式で入力してください");
  });

  test("期間境界を含めて判定する", () => {
    expect(isDateWithinPeriod({ date: "2026-02-01", periodStart: "2026-02-01", periodEnd: "2026-02-28" })).toBe(true);
    expect(isDateWithinPeriod({ date: "2026-02-28", periodStart: "2026-02-01", periodEnd: "2026-02-28" })).toBe(true);
    expect(isDateWithinPeriod({ date: "2026-03-01", periodStart: "2026-02-01", periodEnd: "2026-02-28" })).toBe(false);
  });

  test("締め済み期間の探索", () => {
    const hit = findClosedPeriodByDate({
      closures: [
        {
          id: "1",
          householdId: "h1",
          ledgerId: "l1",
          periodStart: "2026-01-01",
          periodEnd: "2026-01-31",
          status: "closed",
          closedAt: null,
          closedBy: null,
          note: null,
          createdAt: "",
          updatedAt: "",
        },
      ],
      date: "2026-01-15",
    });

    expect(hit?.id).toBe("1");
  });
});
