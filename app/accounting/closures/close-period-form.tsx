"use client";

import { useActionState } from "react";
import { closePeriodAction, initialClosePeriodState } from "@/app/accounting/closures/actions";

export const ClosePeriodForm = ({ householdId, ledgerId, actorUserId, defaultPeriod }: { householdId: string; ledgerId: string; actorUserId: string; defaultPeriod: string }) => {
  const [state, formAction, pending] = useActionState(closePeriodAction, initialClosePeriodState);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-border p-4">
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="ledgerId" value={ledgerId} />
      <input type="hidden" name="actorUserId" value={actorUserId} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          対象月（YYYY-MM）
          <input name="period" defaultValue={defaultPeriod} className="mt-1 w-full rounded-md border border-border px-2 py-2" required />
        </label>
        <label className="text-sm">
          メモ（任意）
          <input name="note" className="mt-1 w-full rounded-md border border-border px-2 py-2" placeholder="締め理由や補足" />
        </label>
      </div>
      <p className="text-xs text-foreground/70">締め済み期間では仕訳・取引・精算の保存をサーバー側で制限します。</p>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        onClick={(event) => {
          if (!window.confirm("指定した月を締めます。締め後は対象期間の更新が制限されます。実行しますか？")) {
            event.preventDefault();
          }
        }}
      >
        {pending ? "締め処理中..." : "月次締めを実行"}
      </button>
      {state.message ? <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-rose-600"}`}>{state.message}</p> : null}
    </form>
  );
};
