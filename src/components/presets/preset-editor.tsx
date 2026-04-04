"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { previewPresetSplit } from "@/lib/preset-preview";
import { CategorySplitPreset, PresetStatus, RoundingMode, SplitMethod } from "@/types/domain";

const presetSchema = z
  .object({
    name: z.string().min(1, "名前は必須です"),
    priority: z.number().int(),
    splitMethod: z.enum(["equal", "ratio", "weight", "mixed_fixed", "fixed_mixed"]),
    members: z.array(
      z.object({
        memberId: z.string(),
        ratio: z.number().optional(),
        weight: z.number().optional(),
        fixedAmount: z.number().optional(),
      }),
    ),
  })
  .superRefine((value, ctx) => {
    if (value.splitMethod === "ratio") {
      const ratioSum = value.members.reduce((acc, row) => acc + (row.ratio ?? 0), 0);
      if (Math.abs(ratioSum - 1) > 0.0001) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ratioの合計は1.0にしてください" });
      }
    }

    if (value.splitMethod === "mixed_fixed" || value.splitMethod === "fixed_mixed") {
      const fixedTotal = value.members.reduce((acc, row) => acc + (row.fixedAmount ?? 0), 0);
      if (fixedTotal < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "固定額は0以上で指定してください" });
      }
    }
  });

const statusOptions: PresetStatus[] = ["draft", "published", "archived"];
const roundingOptions: RoundingMode[] = ["round", "ceil", "floor"];

interface Props {
  open: boolean;
  onClose: () => void;
  value: CategorySplitPreset;
  categories: { id: string; name: string }[];
  memberOptions: { memberId: string; name: string }[];
  onSave: (preset: CategorySplitPreset) => void;
}

export const PresetEditor = ({ open, onClose, value, categories, memberOptions, onSave }: Props) => {
  const [form, setForm] = useState<CategorySplitPreset>(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(value);
  }, [value]);

  const preview = useMemo(() => {
    try {
      return previewPresetSplit({ amount: 12345, memberIds: memberOptions.map((m) => m.memberId), preset: form });
    } catch {
      return [];
    }
  }, [form, memberOptions]);

  if (!open) return null;

  const handleSubmit = () => {
    const parsed = presetSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "入力内容を確認してください");
      return;
    }
    setError(null);
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 p-2 md:p-6">
      <Card className="h-full w-full max-w-2xl overflow-y-auto p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">プリセット編集</h2>
          <Button variant="ghost" onClick={onClose}>閉じる</Button>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">名前<Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label className="space-y-1 text-sm">状態<Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PresetStatus })}>{statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}</Select></label>
          <label className="space-y-1 text-sm">優先度<Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></label>
          <label className="space-y-1 text-sm">分割方式<Select value={form.splitMethod} onChange={(e) => setForm({ ...form, splitMethod: e.target.value as SplitMethod })}><option value="equal">equal</option><option value="ratio">ratio</option><option value="weight">weight</option><option value="mixed_fixed">mixed_fixed</option></Select></label>
          <label className="space-y-1 text-sm">端数処理<Select value={form.roundingMode} onChange={(e) => setForm({ ...form, roundingMode: e.target.value as RoundingMode })}>{roundingOptions.map((mode) => <option key={mode} value={mode}>{mode}</option>)}</Select></label>
          <label className="space-y-1 text-sm">最低金額<Input type="number" value={form.conditions?.minAmount ?? 0} onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, minAmount: Number(e.target.value) } })} /></label>
          <label className="space-y-1 text-sm">キーワード(,区切り)<Input value={(form.conditions?.keywords ?? []).join(",")} onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, keywords: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) } })} /></label>
          <label className="space-y-1 text-sm">曜日(0-6)<Input value={(form.conditions?.weekdays ?? []).join(",")} onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, weekdays: e.target.value.split(",").map((v) => Number(v.trim())).filter((v) => Number.isInteger(v) && v >= 0 && v <= 6) } })} /></label>
          <label className="space-y-1 text-sm">店舗名<Input value={form.conditions?.merchantName ?? ""} onChange={(e) => setForm({ ...form, conditions: { ...form.conditions, merchantName: e.target.value } })} /></label>
          <label className="space-y-1 text-sm md:col-span-2">対象カテゴリ（複数選択）
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3">
              {categories.map((category) => {
                const checked = form.targetCategoryIds.includes(category.id);
                return (
                  <label key={category.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setForm({
                        ...form,
                        targetCategoryIds: e.target.checked
                          ? [...form.targetCategoryIds, category.id]
                          : form.targetCategoryIds.filter((id) => id !== category.id),
                      })}
                    />
                    {category.name}
                  </label>
                );
              })}
            </div>
          </label>
        </div>

        <div className="mt-5 space-y-2">
          <h3 className="font-semibold">メンバー設定</h3>
          {memberOptions.map((member, index) => {
            const config = form.members[index] ?? { memberId: member.memberId };
            return (
              <div key={member.memberId} className="grid gap-2 rounded-xl border border-border p-3 md:grid-cols-4">
                <div className="text-sm font-medium">{member.name}</div>
                <Input type="number" step="0.01" placeholder="ratio" value={config.ratio ?? ""} onChange={(e) => {
                  const next = [...form.members];
                  next[index] = { ...config, memberId: member.memberId, ratio: Number(e.target.value) || 0 };
                  setForm({ ...form, members: next });
                }} />
                <Input type="number" step="0.01" placeholder="weight" value={config.weight ?? ""} onChange={(e) => {
                  const next = [...form.members];
                  next[index] = { ...config, memberId: member.memberId, weight: Number(e.target.value) || 0 };
                  setForm({ ...form, members: next });
                }} />
                <Input type="number" placeholder="fixed" value={config.fixedAmount ?? ""} onChange={(e) => {
                  const next = [...form.members];
                  next[index] = { ...config, memberId: member.memberId, fixedAmount: Number(e.target.value) || 0 };
                  setForm({ ...form, members: next });
                }} />
              </div>
            );
          })}
        </div>

        <div className="mt-5">
          <h3 className="font-semibold">プレビュー（12,345円）</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {preview.map((row) => (
              <li key={row.memberId} className="flex justify-between rounded-xl bg-muted/50 px-3 py-2">
                <span>{memberOptions.find((m) => m.memberId === row.memberId)?.name}</span>
                <span className="font-semibold">¥{row.amount.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>

        {error ? <p className="mt-4 text-sm text-red-500">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSubmit}>保存</Button>
        </div>
      </Card>
    </div>
  );
};
