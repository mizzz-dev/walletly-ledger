"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SimpleTable } from "@/components/ui/table";
import { BudgetProgressSummary, BudgetWithCategory, CategoryOption } from "@/types/domain";
import { createBudgetAction, deleteBudgetAction, updateBudgetAction } from "./actions";

interface Props {
  budgets: BudgetWithCategory[];
  categories: CategoryOption[];
  householdId: string;
  ledgerId: string;
  currentUserId: string;
  initialPeriod: string;
  canEdit: boolean;
  budgetProgress: BudgetProgressSummary;
}

interface BudgetFormState {
  id: string | null;
  categoryId: string;
  period: string;
  amount: string;
}

const createEmptyForm = (period: string): BudgetFormState => ({
  id: null,
  categoryId: "",
  period,
  amount: "",
});

export const BudgetsClient = ({
  budgets,
  categories,
  householdId,
  ledgerId,
  currentUserId,
  initialPeriod,
  canEdit,
  budgetProgress,
}: Props) => {
  const [form, setForm] = useState<BudgetFormState>(createEmptyForm(initialPeriod));
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const periodRows = useMemo(() => budgets.filter((row) => row.period === initialPeriod), [budgets, initialPeriod]);

  const runAction = (action: () => Promise<void>, successMessage: string) => {
    setMessage(null);
    startTransition(() => {
      action()
        .then(() => {
          setMessage(successMessage);
          setForm(createEmptyForm(initialPeriod));
        })
        .catch((error: unknown) => {
          const text = error instanceof Error ? error.message : "操作に失敗しました";
          setMessage(`エラー: ${text}`);
        });
    });
  };

  const submitForm = () => {
    const payload = new FormData();
    payload.set("householdId", householdId);
    payload.set("ledgerId", ledgerId);
    payload.set("createdBy", currentUserId);
    payload.set("categoryId", form.categoryId);
    payload.set("period", form.period);
    payload.set("amount", form.amount || "0");

    if (form.id) {
      payload.set("id", form.id);
      return runAction(() => updateBudgetAction(payload), "予算を更新しました");
    }

    return runAction(() => createBudgetAction(payload), "予算を作成しました");
  };

  const rows = periodRows.map((budget) => [
    budget.categoryName ?? "全体予算",
    budget.period,
    <span key={`${budget.id}-amount`} className="font-semibold tabular-nums">¥{budget.amount.toLocaleString()}</span>,
    canEdit ? (
      <div key={`${budget.id}-actions`} className="flex gap-2">
        <Button
          variant="outline"
          className="h-8"
          onClick={() =>
            setForm({
              id: budget.id,
              categoryId: budget.categoryId ?? "",
              period: budget.period,
              amount: String(budget.amount),
            })
          }
        >
          編集
        </Button>
        <Button
          variant="ghost"
          className="h-8 text-rose-700"
          onClick={() => {
            const payload = new FormData();
            payload.set("id", budget.id);
            runAction(() => deleteBudgetAction(payload), "予算を削除しました");
          }}
        >
          削除
        </Button>
      </div>
    ) : (
      "閲覧のみ"
    ),
  ]);

  return (
    <section className="space-y-4">
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">予算管理</h1>
        <p className="text-sm text-foreground/70">カテゴリごとに月次予算を設定し、ダッシュボードで進捗を確認できます。</p>
        <p className="text-xs text-foreground/70">対象月: {initialPeriod}</p>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">予算進捗サマリ</h2>
        {budgetProgress.items.length === 0 ? (
          <p className="text-sm text-foreground/70">この月の予算はまだありません。</p>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-foreground/70">予算合計</p>
                <p className="text-lg font-bold tabular-nums">¥{budgetProgress.totalBudget.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-foreground/70">使用額合計</p>
                <p className="text-lg font-bold tabular-nums">¥{budgetProgress.totalSpent.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-foreground/70">残額合計</p>
                <p className={`text-lg font-bold tabular-nums ${budgetProgress.totalRemaining < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  ¥{budgetProgress.totalRemaining.toLocaleString()}
                </p>
              </div>
            </div>
            <ul className="space-y-2">
              {budgetProgress.items.map((item) => {
                const width = Math.min(item.progressRate, 100);
                return (
                  <li key={item.budgetId} className="rounded-xl bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <p className="font-medium">{item.categoryName}</p>
                      <p className={item.isOverBudget ? "font-semibold text-rose-700" : "text-foreground/80"}>{item.progressRate.toFixed(1)}%</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-muted">
                      <div className={`h-2 rounded-full ${item.isOverBudget ? "bg-rose-500" : "bg-indigo-500"}`} style={{ width: `${width}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-foreground/70">
                      予算 ¥{item.budgetAmount.toLocaleString()} / 使用 ¥{item.spentAmount.toLocaleString()} / 残額 ¥{item.remainingAmount.toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">予算一覧</h2>
        {periodRows.length === 0 ? (
          <p className="text-sm text-foreground/70">この月に登録された予算はありません。</p>
        ) : (
          <SimpleTable headers={["カテゴリ", "対象月", "予算", "操作"]} rows={rows} />
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">予算の新規作成 / 編集</h2>
        {!canEdit ? <p className="text-sm text-amber-700">この世帯では閲覧権限のため編集できません。</p> : null}
        <div className="grid gap-2 md:grid-cols-3">
          <Select value={form.categoryId} onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value }))} disabled={!canEdit || isPending}>
            <option value="">全体予算（カテゴリなし）</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
          <Input type="month" value={form.period} onChange={(e) => setForm((prev) => ({ ...prev, period: e.target.value }))} disabled={!canEdit || isPending} />
          <Input type="number" min={0} step={1} value={form.amount} onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))} placeholder="予算金額" disabled={!canEdit || isPending} />
        </div>
        <div className="flex gap-2">
          <Button onClick={submitForm} disabled={!canEdit || isPending}>{isPending ? "保存中..." : form.id ? "更新する" : "作成する"}</Button>
          {form.id ? (
            <Button variant="outline" onClick={() => setForm(createEmptyForm(initialPeriod))} disabled={isPending}>
              編集をキャンセル
            </Button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-foreground/80">{message}</p> : null}
      </Card>
    </section>
  );
};
