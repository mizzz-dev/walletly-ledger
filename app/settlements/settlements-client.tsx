"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SettlementEdge } from "@/types/domain";
import { initialSaveSettlementState, saveSettlementAction } from "./actions";

interface Props {
  summaries: Array<{ memberId: string; paid: number; owed: number; net: number; memberName: string }>;
  proposals: SettlementEdge[];
  householdId: string;
  ledgerId: string;
  createdBy: string;
  memberNameMap: Record<string, string>;
  validMemberIds: string[];
}

const SettlementActionForm = ({
  proposal,
  householdId,
  ledgerId,
  createdBy,
  memberNameMap,
  validMemberIds,
}: {
  proposal: SettlementEdge;
  householdId: string;
  ledgerId: string;
  createdBy: string;
  memberNameMap: Record<string, string>;
  validMemberIds: string[];
}) => {
  const [state, action, isPending] = useActionState(saveSettlementAction, initialSaveSettlementState);
  const [method, setMethod] = useState("現金");

  return (
    <form action={action} className="space-y-2 rounded-xl bg-muted/50 px-3 py-3">
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="ledgerId" value={ledgerId} />
      <input type="hidden" name="createdBy" value={createdBy} />
      <input type="hidden" name="fromMemberId" value={proposal.fromMemberId} />
      <input type="hidden" name="toMemberId" value={proposal.toMemberId} />
      <input type="hidden" name="amount" value={proposal.amount} />
      <input type="hidden" name="validMemberIds" value={JSON.stringify(validMemberIds)} />

      <p className="text-sm">
        <span className="font-semibold">{memberNameMap[proposal.fromMemberId] ?? proposal.fromMemberId}</span> が
        <span className="font-semibold"> {memberNameMap[proposal.toMemberId] ?? proposal.toMemberId}</span> に
        <span className="ml-1 font-bold tabular-nums">¥{proposal.amount.toLocaleString()}</span>
      </p>
      <div className="grid gap-2 md:grid-cols-3">
        <Select name="method" value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="現金">現金</option>
          <option value="振込">振込</option>
          <option value="PayPay">PayPay</option>
          <option value="その他">その他</option>
        </Select>
        <Input name="settledOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        <Input name="note" placeholder="メモ（任意）" />
      </div>
      {state.message ? <p className={`text-xs ${state.ok ? "text-emerald-600" : "text-rose-600"}`}>{state.message}</p> : null}
      <Button type="submit" disabled={isPending}>{isPending ? "記録中..." : "この精算を記録"}</Button>
    </form>
  );
};

export const SettlementsClient = ({
  summaries,
  proposals,
  householdId,
  ledgerId,
  createdBy,
  memberNameMap,
  validMemberIds,
}: Props) => {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3">
        <h1 className="text-xl font-bold">未精算サマリ</h1>
        <ul className="space-y-2 text-sm">
          {summaries.map((summary) => (
            <li key={summary.memberId} className="rounded-xl bg-muted/50 px-3 py-2">
              <p className="font-semibold">{summary.memberName}</p>
              <p>立替: ¥{summary.paid.toLocaleString()} / 負担: ¥{summary.owed.toLocaleString()}</p>
              <p className={summary.net >= 0 ? "text-emerald-700" : "text-rose-700"}>残高: ¥{summary.net.toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-semibold">精算提案</h2>
        {proposals.length === 0 ? (
          <p className="text-sm text-foreground/70">未精算はありません。全員の残高が一致しています。</p>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal, idx) => (
              <SettlementActionForm
                key={`${proposal.fromMemberId}-${proposal.toMemberId}-${idx}`}
                proposal={proposal}
                householdId={householdId}
                ledgerId={ledgerId}
                createdBy={createdBy}
                memberNameMap={memberNameMap}
                validMemberIds={validMemberIds}
              />
            ))}
          </div>
        )}
      </Card>
    </section>
  );
};
