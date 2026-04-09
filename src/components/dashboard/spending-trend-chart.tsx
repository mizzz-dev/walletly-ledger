"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardTimeSeriesPoint } from "@/types/domain";

export const SpendingTrendChart = ({ points }: { points: DashboardTimeSeriesPoint[] }) => {
  if (points.length === 0) {
    return <p className="text-sm text-foreground/70">今月の時系列データがありません。</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={points} margin={{ top: 12, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `¥${Number(value).toLocaleString()}`} width={84} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => [`¥${Number(value).toLocaleString()}`, "支出"]} />
          <Bar dataKey="totalSpent" fill="#7c6cff" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
