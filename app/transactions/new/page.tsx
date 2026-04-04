"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { calculateSplit } from "@/lib/split";
import { SplitMethod } from "@/types/domain";

const members = [
  { memberId: "m1", name: "あや" },
  { memberId: "m2", name: "けん" },
  { memberId: "m3", name: "ゲスト" },
];

export default function NewTransactionPage() {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<SplitMethod>("equal");

  const preview = useMemo(
    () =>
      calculateSplit({
        amount: amount || 1,
        method,
        members: members.map((member) => ({ memberId: member.memberId, ratio: 1, weight: 1 })),
      }),
    [amount, method],
  );

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <Card className="space-y-4">
        <h1 className="text-xl font-bold">支出追加</h1>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm">金額<Input type="number" min={0} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></label>
          <label className="space-y-1 text-sm">カテゴリ<Select><option>食費</option><option>交通費</option></Select></label>
          <label className="space-y-1 text-sm">支払者<Select>{members.map((m) => <option key={m.memberId}>{m.name}</option>)}</Select></label>
          <label className="space-y-1 text-sm">分割方式<Select value={method} onChange={(e) => setMethod(e.target.value as SplitMethod)}><option value="equal">等分</option><option value="ratio">比率</option><option value="weight">重み</option><option value="fixed_mixed">固定額混合</option></Select></label>
          <label className="space-y-1 text-sm md:col-span-2">メモ<Input placeholder="例: スーパーまとめ買い" /></label>
          <label className="space-y-1 text-sm md:col-span-2">日付<Input type="date" /></label>
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold">分割プレビュー</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {preview.map((p) => (
            <li key={p.memberId} className="flex justify-between rounded-xl bg-muted/50 px-3 py-2">
              <span>{members.find((m) => m.memberId === p.memberId)?.name}</span>
              <span className="font-semibold tabular-nums">¥{p.amount.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
