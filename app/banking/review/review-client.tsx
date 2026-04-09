"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { BankingReviewItem, CategoryOption, MemberOption } from "@/types/domain";
import { importReviewedBankDraftAction, initialReviewImportState } from "./actions";

const matchLabel = {
  exact: "重複の可能性: 高",
  probable: "重複の可能性: 中",
  none: "重複候補なし",
};

export const BankingReviewClient = ({
  householdId,
  ledgerId,
  userId,
  members,
  categories,
  items,
}: {
  householdId: string;
  ledgerId: string;
  userId: string;
  members: MemberOption[];
  categories: CategoryOption[];
  items: BankingReviewItem[];
}) => {
  const [state, formAction, isPending] = useActionState(importReviewedBankDraftAction, initialReviewImportState);

  return (
    <div className="space-y-4">
      {state.message ? (
        <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-rose-600"}`}>{state.message}</p>
      ) : null}
      {items.length === 0 ? <Card><p className="text-sm text-foreground/70">レビュー対象の明細はありません。</p></Card> : null}
      {items.map((item) => {
        const defaultCategory = item.draft.suggestedCategoryId ?? categories[0]?.id ?? "";
        const defaultPayer = members[0]?.membershipId ?? "";
        const splitPayload = item.splitPreview.length > 0
          ? item.splitPreview
          : members.map((member) => ({ memberId: member.membershipId, amount: Number(((item.draft.amount ?? 0) / Math.max(members.length, 1)).toFixed(2)) }));

        return (
          <Card key={item.bankTransactionId} className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.draft.date} / {item.accountDisplayName}</p>
                <p className="text-sm text-foreground/70">状態: {item.direction === "outflow" ? "出金" : "入金"}</p>
                <p className="text-xs text-foreground/70">{matchLabel[item.matchResult.level]}</p>
                {item.matchResult.reason ? <p className="text-xs text-amber-700">{item.matchResult.reason}</p> : null}
                {item.draft.warnings.map((warning) => <p key={warning} className="text-xs text-amber-700">{warning}</p>)}
              </div>
              <div className="text-right">
                <p className="font-semibold">¥{(item.draft.amount ?? 0).toLocaleString()}</p>
                <p className="text-xs text-foreground/70">推定精度: {item.draft.confidence ? `${Math.round(item.draft.confidence * 100)}%` : "-"}</p>
              </div>
            </div>

            <form action={formAction} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="householdId" value={householdId} />
              <input type="hidden" name="ledgerId" value={ledgerId} />
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="bankTransactionId" value={item.bankTransactionId} />
              <input type="hidden" name="appliedPresetId" value={item.presetId ?? ""} />
              <input type="hidden" name="validMemberIds" value={JSON.stringify(members.map((member) => member.membershipId))} />
              <input type="hidden" name="splitPayload" value={JSON.stringify(splitPayload)} />

              <label className="space-y-1 text-sm">
                金額
                <Input name="amount" type="number" defaultValue={item.draft.amount ?? 0} min={1} />
              </label>
              <label className="space-y-1 text-sm">
                日付
                <Input name="transactionDate" type="date" defaultValue={item.draft.date ?? ""} />
              </label>
              <label className="space-y-1 text-sm">
                店舗名
                <Input name="merchant" defaultValue={item.draft.merchant ?? ""} />
              </label>
              <label className="space-y-1 text-sm">
                カテゴリ
                <Select name="categoryId" defaultValue={defaultCategory}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1 text-sm">
                支払者
                <Select name="payerMembershipId" defaultValue={defaultPayer}>
                  {members.map((member) => (
                    <option key={member.membershipId} value={member.membershipId}>{member.name}</option>
                  ))}
                </Select>
              </label>
              <label className="space-y-1 text-sm md:col-span-2">
                メモ
                <Input name="note" defaultValue={item.draft.note ?? ""} />
              </label>
              <div className="md:col-span-2 flex items-center justify-between">
                <p className="text-xs text-foreground/70">
                  {item.presetId ? "カテゴリ連動プリセットを候補適用済み" : "プリセット候補なし"}
                </p>
                <Button disabled={isPending || item.direction !== "outflow" || item.matchResult.level === "exact"}>
                  {isPending ? "登録中..." : "新規取引として登録"}
                </Button>
              </div>
            </form>
          </Card>
        );
      })}
    </div>
  );
};
