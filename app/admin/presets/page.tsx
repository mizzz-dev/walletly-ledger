"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SimpleTable } from "@/components/ui/table";

const presets = [
  { name: "食費基本", categories: "食費, 日用品", status: "published", priority: 100, method: "equal" },
  { name: "旅行交通", categories: "交通費", status: "draft", priority: 80, method: "ratio" },
  { name: "取引先会食", categories: "交際費", status: "archived", priority: 60, method: "fixed_mixed" },
];

export default function PresetsPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => presets.filter((p) => p.name.includes(query)).map((preset) => [preset.name, preset.categories, preset.method, preset.priority, preset.status, <div className="flex gap-2" key={preset.name}><Button className="h-9" variant="outline">編集</Button><Button className="h-9" variant="ghost">複製</Button></div>]),
    [query],
  );

  return (
    <section className="space-y-4">
      <Card className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold">分割プリセット管理</h1>
          <p className="text-sm text-foreground/70">カテゴリ横断で検索・フィルタ・状態管理</p>
        </div>
        <div className="flex w-full gap-2 md:w-auto">
          <Input placeholder="名前で検索" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button>新規作成</Button>
        </div>
      </Card>
      <SimpleTable headers={["名前", "カテゴリ", "分割", "優先度", "状態", "操作"]} rows={rows} />
    </section>
  );
}
