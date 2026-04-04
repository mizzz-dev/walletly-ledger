"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "食費", value: 42000 },
  { name: "住居", value: 90000 },
  { name: "交通", value: 18000 },
  { name: "その他", value: 12000 },
];

export const MonthlyOverviewChart = () => (
  <div className="h-72 w-full">
    <ResponsiveContainer>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} fill="#7c6cff" />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
