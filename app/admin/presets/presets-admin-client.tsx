"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SimpleTable } from "@/components/ui/table";
import { PresetEditor } from "@/components/presets/preset-editor";
import { CategoryOption, CategorySplitPreset, MemberOption, PresetStatus } from "@/types/domain";
import { archivePresetAction, duplicatePresetAction, savePresetAction, updatePresetPriorityAction, updatePresetStatusAction } from "./actions";

const createEmptyPreset = (members: MemberOption[]): CategorySplitPreset => ({
  id: crypto.randomUUID(),
  name: "新規プリセット",
  status: "draft",
  priority: 50,
  targetCategoryIds: [],
  splitMethod: "equal",
  roundingMode: "round",
  conditions: {},
  members: members.map((member) => ({ memberId: member.membershipId })),
  updatedAt: new Date().toISOString(),
});

interface Props {
  initialPresets: CategorySplitPreset[];
  categories: CategoryOption[];
  members: MemberOption[];
  householdId: string;
  ledgerId: string | null;
  userId: string | null;
}

export const PresetsAdminClient = ({ initialPresets, categories, members, householdId, ledgerId, userId }: Props) => {
  const [presets, setPresets] = useState<CategorySplitPreset[]>(initialPresets);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PresetStatus>("all");
  const [sortBy, setSortBy] = useState<"priority" | "updatedAt" | "name">("priority");
  const [editing, setEditing] = useState<CategorySplitPreset | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const rows = presets.filter((preset) => {
      if (statusFilter !== "all" && preset.status !== statusFilter) return false;
      if (!query) return true;
      const categoryNames = preset.targetCategoryIds.map((id) => categories.find((category) => category.id === id)?.name ?? "").join(" ");
      return `${preset.name} ${categoryNames}`.toLowerCase().includes(query.toLowerCase());
    });

    return rows.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "updatedAt") return b.updatedAt.localeCompare(a.updatedAt);
      return b.priority - a.priority;
    });
  }, [presets, query, statusFilter, sortBy, categories]);

  const runAction = (action: () => Promise<void>, successMessage: string) => {
    setMessage(null);
    startTransition(() => {
      action()
        .then(() => setMessage(successMessage))
        .catch((error: unknown) => {
          const text = error instanceof Error ? error.message : "保存に失敗しました";
          setMessage(`エラー: ${text}`);
        });
    });
  };

  const rows = filtered.map((preset) => [
    preset.name,
    preset.targetCategoryIds.map((id) => categories.find((category) => category.id === id)?.name ?? id).join(", "),
    preset.splitMethod,
    <Input
      key={`${preset.id}-priority`}
      className="h-9 w-24"
      type="number"
      value={preset.priority}
      onBlur={(e) => runAction(() => updatePresetPriorityAction(preset.id, Number(e.target.value)), "優先度を保存しました")}
      onChange={(e) => setPresets((prev) => prev.map((row) => (row.id === preset.id ? { ...row, priority: Number(e.target.value) } : row)))}
    />,
    <Select
      key={`${preset.id}-status`}
      value={preset.status}
      onChange={(e) => runAction(async () => {
        const status = e.target.value as PresetStatus;
        await updatePresetStatusAction(preset.id, status);
        setPresets((prev) => prev.map((row) => (row.id === preset.id ? { ...row, status } : row)));
      }, "状態を更新しました")}
    >
      <option value="draft">draft</option>
      <option value="published">published</option>
      <option value="archived">archived</option>
    </Select>,
    <div className="flex gap-2" key={preset.id}>
      <Button className="h-9" variant="outline" onClick={() => setEditing(preset)}>編集</Button>
      <Button className="h-9" variant="ghost" onClick={() => runAction(async () => {
        const duplicated = await duplicatePresetAction({ id: preset.id, userId });
        setPresets((prev) => [duplicated, ...prev]);
      }, "複製しました")}>複製</Button>
      <Button className="h-9" variant="ghost" onClick={() => runAction(async () => {
        await archivePresetAction(preset.id);
        setPresets((prev) => prev.map((row) => (row.id === preset.id ? { ...row, status: "archived" } : row)));
      }, "アーカイブしました")}>アーカイブ</Button>
    </div>,
  ]);

  if (categories.length === 0) {
    return <p className="text-sm text-foreground/70">この台帳にはカテゴリが未登録です。先にカテゴリを作成してください。</p>;
  }

  return (
    <section className="space-y-4">
      <Card className="space-y-3">
        <div>
          <h1 className="text-xl font-bold">分割プリセット管理</h1>
          <p className="text-sm text-foreground/70">Supabaseに保存される実データを編集できます</p>
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_180px_180px_auto]">
          <Input placeholder="名前・カテゴリで検索" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | PresetStatus)}>
            <option value="all">状態: すべて</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as "priority" | "updatedAt" | "name") }>
            <option value="priority">優先度順</option>
            <option value="updatedAt">更新日時順</option>
            <option value="name">名前順</option>
          </Select>
          <Button onClick={() => setEditing(createEmptyPreset(members))}>新規作成</Button>
        </div>
        {message ? <p className="text-sm text-foreground/80">{message}</p> : null}
        {isPending ? <p className="text-xs text-foreground/70">保存処理中...</p> : null}
        <p className="text-xs text-foreground/70">対象: household={householdId} / ledger={ledgerId ?? "未選択"}</p>
      </Card>

      <SimpleTable headers={["名前", "カテゴリ", "分割", "優先度", "状態", "操作"]} rows={rows} />

      {editing ? (
        <PresetEditor
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
          value={editing}
          categories={categories}
          memberOptions={members.map((member) => ({ memberId: member.membershipId, name: member.name }))}
          onSave={(saved) => runAction(async () => {
            const next = await savePresetAction({
              householdId,
              ledgerId,
              userId,
              preset: saved,
            });
            setPresets((prev) => {
              const exists = prev.some((row) => row.id === next.id);
              if (exists) return prev.map((row) => (row.id === next.id ? next : row));
              return [next, ...prev];
            });
          }, "保存しました")}
        />
      ) : null}
    </section>
  );
};
