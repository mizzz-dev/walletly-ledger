"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SimpleTable } from "@/components/ui/table";
import { PresetEditor } from "@/components/presets/preset-editor";
import { createMockPresetRepository } from "@/lib/preset-repository";
import { CategorySplitPreset, PresetStatus } from "@/types/domain";

const categories = [
  { id: "food", name: "食費" },
  { id: "daily", name: "日用品" },
  { id: "transport", name: "交通費" },
  { id: "travel", name: "旅行" },
];

const members = [
  { memberId: "m1", name: "あや" },
  { memberId: "m2", name: "けん" },
  { memberId: "m3", name: "ゲスト" },
];

const createEmptyPreset = (): CategorySplitPreset => ({
  id: `preset-${crypto.randomUUID()}`,
  name: "新規プリセット",
  status: "draft",
  priority: 50,
  targetCategoryIds: [],
  splitMethod: "equal",
  roundingMode: "round",
  conditions: {},
  members: members.map((member) => ({ memberId: member.memberId })),
  updatedAt: new Date().toISOString(),
});

export default function PresetsPage() {
  const [presets, setPresets] = useState<CategorySplitPreset[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PresetStatus>("all");
  const [sortBy, setSortBy] = useState<"priority" | "updatedAt" | "name">("priority");
  const [editing, setEditing] = useState<CategorySplitPreset | null>(null);

  useEffect(() => {
    const repository = createMockPresetRepository();
    repository.listCategorySplitPresets().then(setPresets);
  }, []);

  const filtered = useMemo(() => {
    const rows = presets.filter((preset) => {
      if (statusFilter !== "all" && preset.status !== statusFilter) return false;
      if (!query) return true;
      const categoryNames = preset.targetCategoryIds.map((id) => categories.find((c) => c.id === id)?.name ?? "").join(" ");
      return `${preset.name} ${categoryNames}`.toLowerCase().includes(query.toLowerCase());
    });

    return rows.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "updatedAt") return b.updatedAt.localeCompare(a.updatedAt);
      return b.priority - a.priority;
    });
  }, [presets, query, statusFilter, sortBy]);

  const archivePreset = (id: string) => setPresets((prev) => prev.map((row) => (row.id === id ? { ...row, status: "archived" } : row)));
  const duplicatePreset = (preset: CategorySplitPreset) => setPresets((prev) => [{ ...preset, id: `preset-${crypto.randomUUID()}`, name: `${preset.name}（複製）`, status: "draft", updatedAt: new Date().toISOString() }, ...prev]);

  const rows = filtered.map((preset) => [
    preset.name,
    preset.targetCategoryIds.map((id) => categories.find((c) => c.id === id)?.name ?? id).join(", "),
    preset.splitMethod,
    <Input key={`${preset.id}-priority`} className="h-9 w-24" type="number" value={preset.priority} onChange={(e) => setPresets((prev) => prev.map((row) => row.id === preset.id ? { ...row, priority: Number(e.target.value) } : row))} />,
    preset.status,
    <div className="flex gap-2" key={preset.id}><Button className="h-9" variant="outline" onClick={() => setEditing(preset)}>編集</Button><Button className="h-9" variant="ghost" onClick={() => duplicatePreset(preset)}>複製</Button><Button className="h-9" variant="ghost" onClick={() => archivePreset(preset.id)}>アーカイブ</Button></div>,
  ]);

  return (
    <section className="space-y-4">
      <Card className="space-y-3">
        <div>
          <h1 className="text-xl font-bold">分割プリセット管理</h1>
          <p className="text-sm text-foreground/70">DataTableライクな一覧で検索・フィルタ・優先度管理ができます</p>
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_180px_180px_auto]">
          <Input placeholder="名前・カテゴリで検索" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | PresetStatus)}>
            <option value="all">状態: すべて</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as "priority" | "updatedAt" | "name")}>
            <option value="priority">優先度順</option>
            <option value="updatedAt">更新日時順</option>
            <option value="name">名前順</option>
          </Select>
          <Button onClick={() => setEditing(createEmptyPreset())}>新規作成</Button>
        </div>
      </Card>

      <SimpleTable headers={["名前", "カテゴリ", "分割", "優先度", "状態", "操作"]} rows={rows} />

      {editing ? (
        <PresetEditor
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          value={editing}
          categories={categories}
          memberOptions={members}
          onSave={(saved) => {
            setPresets((prev) => {
              const exists = prev.some((row) => row.id === saved.id);
              if (exists) return prev.map((row) => (row.id === saved.id ? { ...saved, updatedAt: new Date().toISOString() } : row));
              return [{ ...saved, updatedAt: new Date().toISOString() }, ...prev];
            });
          }}
        />
      ) : null}
    </section>
  );
}
