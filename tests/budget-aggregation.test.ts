import { describe, expect, it } from "vitest";
import { aggregateBudgetProgress } from "@/lib/budgets/aggregation";

describe("budget aggregation", () => {
  it("カテゴリ別予算と実績から進捗を計算できる", () => {
    const result = aggregateBudgetProgress({
      period: "2026-04",
      budgets: [
        {
          id: "b1",
          householdId: "h1",
          ledgerId: "l1",
          categoryId: "food",
          categoryName: "食費",
          period: "2026-04",
          amount: 30000,
          createdBy: "u1",
          createdAt: "2026-04-01T00:00:00Z",
          updatedAt: "2026-04-01T00:00:00Z",
        },
      ],
      transactions: [
        {
          id: "t1",
          date: "2026-04-02",
          amount: 12000,
          categoryId: "food",
          categoryName: "食費",
          categoryColor: "#ef4444",
        },
      ],
    });

    expect(result.items[0]).toMatchObject({
      categoryName: "食費",
      budgetAmount: 30000,
      spentAmount: 12000,
      remainingAmount: 18000,
      progressRate: 40,
      isOverBudget: false,
    });
  });

  it("境界値(0円 / ぴったり / 超過)を処理できる", () => {
    const result = aggregateBudgetProgress({
      period: "2026-04",
      budgets: [
        {
          id: "b-zero",
          householdId: "h1",
          ledgerId: "l1",
          categoryId: "zero",
          categoryName: "0円テスト",
          period: "2026-04",
          amount: 0,
          createdBy: "u1",
          createdAt: "2026-04-01T00:00:00Z",
          updatedAt: "2026-04-01T00:00:00Z",
        },
        {
          id: "b-eq",
          householdId: "h1",
          ledgerId: "l1",
          categoryId: "eq",
          categoryName: "ぴったり",
          period: "2026-04",
          amount: 1000,
          createdBy: "u1",
          createdAt: "2026-04-01T00:00:00Z",
          updatedAt: "2026-04-01T00:00:00Z",
        },
        {
          id: "b-over",
          householdId: "h1",
          ledgerId: "l1",
          categoryId: "over",
          categoryName: "超過",
          period: "2026-04",
          amount: 1000,
          createdBy: "u1",
          createdAt: "2026-04-01T00:00:00Z",
          updatedAt: "2026-04-01T00:00:00Z",
        },
      ],
      transactions: [
        { id: "t-zero", date: "2026-04-03", amount: 10, categoryId: "zero", categoryName: "0円テスト", categoryColor: null },
        { id: "t-eq", date: "2026-04-04", amount: 1000, categoryId: "eq", categoryName: "ぴったり", categoryColor: null },
        { id: "t-over", date: "2026-04-05", amount: 1200, categoryId: "over", categoryName: "超過", categoryColor: null },
      ],
    });

    const zero = result.items.find((item) => item.budgetId === "b-zero");
    const exactly = result.items.find((item) => item.budgetId === "b-eq");
    const over = result.items.find((item) => item.budgetId === "b-over");

    expect(zero?.progressRate).toBe(100);
    expect(zero?.isOverBudget).toBe(true);
    expect(exactly?.remainingAmount).toBe(0);
    expect(exactly?.isOverBudget).toBe(false);
    expect(over?.remainingAmount).toBe(-200);
    expect(over?.isOverBudget).toBe(true);
  });

  it("カテゴリなし予算は全体支出で計算する", () => {
    const result = aggregateBudgetProgress({
      period: "2026-04",
      budgets: [
        {
          id: "b-all",
          householdId: "h1",
          ledgerId: "l1",
          categoryId: null,
          categoryName: null,
          period: "2026-04",
          amount: 5000,
          createdBy: "u1",
          createdAt: "2026-04-01T00:00:00Z",
          updatedAt: "2026-04-01T00:00:00Z",
        },
      ],
      transactions: [
        { id: "t1", date: "2026-04-01", amount: 1000, categoryId: "a", categoryName: "A", categoryColor: null },
        { id: "t2", date: "2026-04-10", amount: 2000, categoryId: "b", categoryName: "B", categoryColor: null },
      ],
    });

    expect(result.items[0]).toMatchObject({
      categoryName: "全体予算",
      spentAmount: 3000,
      remainingAmount: 2000,
      progressRate: 60,
    });
  });
});
