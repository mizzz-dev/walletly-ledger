import { describe, expect, test } from "vitest";
import { assertEditableByClosures, buildClosedPeriodErrorMessage } from "@/lib/accounting/closure-guard";

describe("closure guard", () => {
  test("締め済み期間では更新を拒否する", () => {
    expect(() =>
      assertEditableByClosures({
        date: "2026-03-10",
        operationLabel: "取引更新",
        closures: [
          {
            id: "c1",
            householdId: "h1",
            ledgerId: "l1",
            periodStart: "2026-03-01",
            periodEnd: "2026-03-31",
            status: "closed",
            closedAt: null,
            closedBy: null,
            note: null,
            createdAt: "",
            updatedAt: "",
          },
        ],
      }),
    ).toThrowError("取引更新は締め済み期間（2026-03）のため実行できません");
  });

  test("未締め期間は許可する", () => {
    expect(() =>
      assertEditableByClosures({
        date: "2026-04-01",
        operationLabel: "仕訳更新",
        closures: [
          {
            id: "c1",
            householdId: "h1",
            ledgerId: "l1",
            periodStart: "2026-03-01",
            periodEnd: "2026-03-31",
            status: "closed",
            closedAt: null,
            closedBy: null,
            note: null,
            createdAt: "",
            updatedAt: "",
          },
        ],
      }),
    ).not.toThrow();
  });

  test("エラーメッセージを生成する", () => {
    expect(buildClosedPeriodErrorMessage({ operationLabel: "精算記録の保存", periodStart: "2026-01-01" })).toBe(
      "精算記録の保存は締め済み期間（2026-01）のため実行できません",
    );
  });
});
