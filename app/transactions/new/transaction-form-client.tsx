"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { findApplicablePreset } from "@/lib/preset-matcher";
import { previewPresetSplit } from "@/lib/preset-preview";
import { calculateSplit } from "@/lib/split";
import { CategoryOption, CategorySplitPreset, MemberOption, SplitMethod } from "@/types/domain";

interface Props {
  presets: CategorySplitPreset[];
  categories: CategoryOption[];
  members: MemberOption[];
}

export const NewTransactionClient = ({ presets, categories, members }: Props) => {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<SplitMethod>("equal");
  const [note, setNote] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [appliedPresetId, setAppliedPresetId] = useState<string | null>(null);
  const [manualPreview, setManualPreview] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const appliedPreset = useMemo(
    () => findApplicablePreset(presets, { categoryId, amount, note, merchantName, transactionDate: date }),
    [presets, categoryId, amount, note, merchantName, date],
  );

  useEffect(() => {
    if (!appliedPreset) {
      setAppliedPresetId(null);
      return;
    }
    setAppliedPresetId(appliedPreset.id);
    setMethod(appliedPreset.splitMethod);
  }, [appliedPreset]);

  const autoPreview = useMemo(() => {
    if (members.length === 0) {
      return [];
    }

    if (!appliedPreset || amount <= 0) {
      return calculateSplit({
        amount: amount || 1,
        method,
        members: members.map((member) => ({ memberId: member.membershipId, ratio: 1, weight: 1 })),
      });
    }

    try {
      return previewPresetSplit({ amount, preset: appliedPreset, memberIds: members.map((member) => member.membershipId) });
    } catch {
      return [];
    }
  }, [amount, method, appliedPreset, members]);

  const preview = autoPreview.map((row) => ({ ...row, amount: manualPreview[row.memberId] ?? row.amount }));

  if (categories.length === 0) {
    return <p className="text-sm text-foreground/70">この台帳にはカテゴリが未登録です。先にカテゴリを登録してください。</p>;
  }

  if (members.length === 0) {
    return <p className="text-sm text-foreground/70">この世帯にはメンバーが未登録です。メンバー追加後に支出を作成できます。</p>;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="space-y-4">
        <h1 className="text-xl font-bold">支出追加</h1>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">金額<Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
          <label className="space-y-1 text-sm">カテゴリ<Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></label>
          <label className="space-y-1 text-sm">支払者<Select>{members.map((member) => <option key={member.membershipId} value={member.membershipId}>{member.name}</option>)}</Select></label>
          <label className="space-y-1 text-sm">分割方式<Select value={method} onChange={(e) => setMethod(e.target.value as SplitMethod)}><option value="equal">等分</option><option value="ratio">比率</option><option value="weight">重み</option><option value="mixed_fixed">固定額混合</option></Select></label>
          <label className="space-y-1 text-sm">店舗名<Input placeholder="例: JR東日本" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} /></label>
          <label className="space-y-1 text-sm md:col-span-2">メモ<Input placeholder="例: スーパーまとめ買い" value={note} onChange={(e) => setNote(e.target.value)} /></label>
          <label className="space-y-1 text-sm md:col-span-2">日付<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">分割プレビュー</h2>
        <p className="mt-1 text-xs text-foreground/70">適用中プリセット: {appliedPresetId ? appliedPreset?.name : "なし"}</p>
        <ul className="mt-3 space-y-2 text-sm">
          {preview.map((row) => (
            <li key={row.memberId} className="space-y-2 rounded-xl bg-muted/50 px-3 py-2">
              <div className="flex justify-between">
                <span>{members.find((member) => member.membershipId === row.memberId)?.name ?? row.memberId}</span>
                <span className="font-semibold tabular-nums">¥{row.amount.toLocaleString()}</span>
              </div>
              <Input type="number" value={row.amount} onChange={(e) => setManualPreview((prev) => ({ ...prev, [row.memberId]: Number(e.target.value) }))} />
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
};
