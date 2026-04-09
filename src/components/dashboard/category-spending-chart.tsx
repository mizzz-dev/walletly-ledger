"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { DashboardCategorySummary } from "@/types/domain";

export const CategorySpendingChart = ({ categories }: { categories: DashboardCategorySummary[] }) => {
  if (categories.length === 0) {
    return <p className="text-sm text-foreground/70">今月のカテゴリ別データがありません。</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={categories} dataKey="totalSpent" nameKey="categoryName" innerRadius={68} outerRadius={100}>
            {categories.map((entry) => (
              <Cell key={entry.categoryId} fill={entry.categoryColor} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`¥${Number(value).toLocaleString()}`, "支出"]} />
          <Legend verticalAlign="bottom" />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 grid gap-1 text-xs text-foreground/80 sm:grid-cols-2">
        {categories.map((category) => (
          <p key={`${category.categoryId}-legend`}>
            {category.categoryName}: {category.percentage.toFixed(1)}%
          </p>
        ))}
      </div>
    </div>
  );
};
