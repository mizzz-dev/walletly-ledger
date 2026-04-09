import { describe, expect, it } from "vitest";
import { aggregateDashboardData, resolvePreviousYearMonth } from "@/lib/dashboard/aggregation";

describe("dashboard aggregation", () => {
  it("月次サマリを集計できる", () => {
    const result = aggregateDashboardData({
      yearMonth: "2026-04",
      transactions: [
        {
          id: "t1",
          date: "2026-04-03",
          amount: 1200,
          categoryId: "food",
          categoryName: "食費",
          categoryColor: "#ef4444",
        },
        {
          id: "t2",
          date: "2026-04-10",
          amount: 800,
          categoryId: "transport",
          categoryName: "交通",
          categoryColor: "#22c55e",
        },
        {
          id: "t3",
          date: "2026-03-20",
          amount: 1500,
          categoryId: "food",
          categoryName: "食費",
          categoryColor: "#ef4444",
        },
      ],
    });

    expect(result.summary.totalSpent).toBe(2000);
    expect(result.summary.transactionCount).toBe(2);
    expect(result.summary.previousMonthTotalSpent).toBe(1500);
    expect(result.summary.diffFromPreviousMonth).toBe(500);
  });

  it("カテゴリ別割合を集計できる", () => {
    const result = aggregateDashboardData({
      yearMonth: "2026-04",
      transactions: [
        {
          id: "t1",
          date: "2026-04-03",
          amount: 700,
          categoryId: "food",
          categoryName: "食費",
          categoryColor: "#ef4444",
        },
        {
          id: "t2",
          date: "2026-04-05",
          amount: 300,
          categoryId: "food",
          categoryName: "食費",
          categoryColor: "#ef4444",
        },
        {
          id: "t3",
          date: "2026-04-07",
          amount: 1000,
          categoryId: "rent",
          categoryName: "住居",
          categoryColor: "#3b82f6",
        },
      ],
    });

    expect(result.categories).toEqual([
      {
        categoryId: "food",
        categoryName: "食費",
        categoryColor: "#ef4444",
        totalSpent: 1000,
        percentage: 50,
      },
      {
        categoryId: "rent",
        categoryName: "住居",
        categoryColor: "#3b82f6",
        totalSpent: 1000,
        percentage: 50,
      },
    ]);
  });

  it("日別の時系列を集計できる", () => {
    const result = aggregateDashboardData({
      yearMonth: "2026-04",
      transactions: [
        {
          id: "t1",
          date: "2026-04-01",
          amount: 500,
          categoryId: "food",
          categoryName: "食費",
          categoryColor: "#ef4444",
        },
        {
          id: "t2",
          date: "2026-04-01",
          amount: 200,
          categoryId: "transport",
          categoryName: "交通",
          categoryColor: "#22c55e",
        },
        {
          id: "t3",
          date: "2026-04-03",
          amount: 100,
          categoryId: "other",
          categoryName: "その他",
          categoryColor: "#a855f7",
        },
      ],
    });

    expect(result.timeSeries).toEqual([
      { date: "2026-04-01", label: "4/1", totalSpent: 700 },
      { date: "2026-04-03", label: "4/3", totalSpent: 100 },
    ]);
  });

  it("空データでも安全に集計できる", () => {
    const result = aggregateDashboardData({
      yearMonth: "2026-04",
      transactions: [],
    });

    expect(result.summary.totalSpent).toBe(0);
    expect(result.summary.transactionCount).toBe(0);
    expect(result.categories).toEqual([]);
    expect(result.timeSeries).toEqual([]);
  });

  it("境界値(0円・1件・カテゴリ欠損)を処理できる", () => {
    const result = aggregateDashboardData({
      yearMonth: "2026-04",
      transactions: [
        {
          id: "t1",
          date: "2026-04-12",
          amount: 0,
          categoryId: null,
          categoryName: null,
          categoryColor: null,
        },
      ],
    });

    expect(result.summary.totalSpent).toBe(0);
    expect(result.summary.transactionCount).toBe(1);
    expect(result.categories).toEqual([
      {
        categoryId: "uncategorized",
        categoryName: "未分類",
        categoryColor: "#94a3b8",
        totalSpent: 0,
        percentage: 0,
      },
    ]);
    expect(result.timeSeries).toEqual([{ date: "2026-04-12", label: "4/12", totalSpent: 0 }]);
  });

  it("年跨ぎの前月判定ができる", () => {
    expect(resolvePreviousYearMonth("2026-01")).toBe("2025-12");
  });
});
