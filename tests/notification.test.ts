import { describe, expect, it } from "vitest";
import { buildBudgetAlertMessage, detectBudgetAlertCandidates } from "@/lib/notifications/budget-alert";
import { buildSettlementReminderMessage, detectSettlementReminderCandidate } from "@/lib/notifications/settlement-alert";

describe("notification logic", () => {
  it("予算進捗80%以上で通知候補を検知できる", () => {
    const candidates = detectBudgetAlertCandidates([
      {
        budgetId: "b1",
        categoryId: "c1",
        categoryName: "食費",
        period: "2026-04",
        budgetAmount: 10000,
        spentAmount: 8500,
        remainingAmount: 1500,
        progressRate: 85,
        isOverBudget: false,
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({ level: "threshold_80", categoryName: "食費", progressRate: 85 });
    expect(buildBudgetAlertMessage(candidates[0]).title).toContain("80%");
  });

  it("予算100%以上は超過通知を優先する", () => {
    const candidates = detectBudgetAlertCandidates([
      {
        budgetId: "b2",
        categoryId: "c2",
        categoryName: "交通費",
        period: "2026-04",
        budgetAmount: 5000,
        spentAmount: 5300,
        remainingAmount: -300,
        progressRate: 106,
        isOverBudget: true,
      },
    ]);

    expect(candidates[0]?.level).toBe("over_100");
    expect(buildBudgetAlertMessage(candidates[0]).title).toContain("予算超過");
  });

  it("未精算があり最終精算から一定期間経過していれば精算通知候補を作る", () => {
    const reminder = detectSettlementReminderCandidate({
      summaries: [
        { memberId: "m1", paid: 10000, owed: 6000, net: 4000 },
        { memberId: "m2", paid: 3000, owed: 7000, net: -4000 },
      ],
      lastSettlementAt: "2026-03-20T00:00:00Z",
      now: new Date("2026-04-09T00:00:00Z"),
      remindAfterDays: 7,
    });

    expect(reminder).not.toBeNull();
    expect(reminder?.unsettledAmount).toBe(4000);
    expect(buildSettlementReminderMessage(reminder!)).toMatchObject({ title: "精算リマインド" });
  });

  it("最終精算が近い場合はリマインドしない", () => {
    const reminder = detectSettlementReminderCandidate({
      summaries: [
        { memberId: "m1", paid: 5000, owed: 3000, net: 2000 },
        { memberId: "m2", paid: 1000, owed: 3000, net: -2000 },
      ],
      lastSettlementAt: "2026-04-07T00:00:00Z",
      now: new Date("2026-04-09T00:00:00Z"),
      remindAfterDays: 7,
    });

    expect(reminder).toBeNull();
  });
});
