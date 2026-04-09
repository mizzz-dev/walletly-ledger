"use client";

import { ChangeEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ReceiptDraft } from "@/types/domain";
import { generateReceiptDraftAction, initialGenerateReceiptDraftState } from "@/app/transactions/new/actions";

interface Props {
  householdId: string;
  ledgerId: string;
  userId: string;
  onDraftReady: (draft: ReceiptDraft, receiptAttachmentId: string | null) => void;
}

export const ReceiptOcrPanel = ({ householdId, ledgerId, userId, onDraftReady }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState(initialGenerateReceiptDraftState);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.set("householdId", householdId);
    formData.set("ledgerId", ledgerId);
    formData.set("userId", userId);
    formData.set("receiptImage", file);

    startTransition(async () => {
      const nextState = await generateReceiptDraftAction(formData);
      setState(nextState);
      if (nextState.ok && nextState.draft) {
        onDraftReady(nextState.draft, nextState.receiptAttachmentId);
      }
    });
  };

  return (
    <Card className="space-y-3 border-dashed">
      <h2 className="text-sm font-semibold">レシートOCR取り込み</h2>
      <p className="text-xs text-foreground/70">撮影または画像アップロード後に、金額・日付・店舗名・メモ候補を自動入力します（あとで編集できます）。</p>
      <Input
        ref={fileInputRef}
        type="file"
        name="receiptImage"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        disabled={isPending}
      />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
          {isPending ? "OCR処理中..." : "レシートを選択 / 撮影"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            if (!fileInputRef.current) return;
            fileInputRef.current.value = "";
            setState(initialGenerateReceiptDraftState);
          }}
        >
          リセット
        </Button>
      </div>
      {state.message ? <p className={`text-xs ${state.ok ? "text-emerald-600" : "text-rose-600"}`}>{state.message}</p> : null}
      {state.draft ? (
        <ul className="space-y-1 rounded-md bg-muted/40 p-2 text-xs text-foreground/80">
          <li>候補金額: {state.draft.amount ? `¥${state.draft.amount.toLocaleString()}` : "未抽出"}</li>
          <li>候補日付: {state.draft.transactionDate ?? "未抽出"}</li>
          <li>候補店舗: {state.draft.merchantName ?? "未抽出"}</li>
        </ul>
      ) : null}
    </Card>
  );
};
