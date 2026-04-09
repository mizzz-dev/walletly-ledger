"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { initialSaveJournalState, saveJournalAction } from "@/app/accounting/journals/actions";
import { AccountMaster, JournalDraft } from "@/types/domain";
import { DEFAULT_TAX_CODES } from "@/lib/accounting/tax-mapping";
import { calculateJournalBalance } from "@/lib/accounting/journal-balance";

export const NewJournalForm = ({
  householdId,
  ledgerId,
  ledgerType,
  createdBy,
  draft,
  accounts,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: "work";
  createdBy: string;
  draft: JournalDraft;
  accounts: AccountMaster[];
}) => {
  const [state, formAction, pending] = useActionState(saveJournalAction, initialSaveJournalState);
  const debitLine = draft.lines.find((line) => line.dc === "debit") ?? draft.lines[0];
  const creditLine = draft.lines.find((line) => line.dc === "credit") ?? draft.lines[1];
  const balance = calculateJournalBalance(draft.lines);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="householdId" value={householdId} />
      <input type="hidden" name="ledgerId" value={ledgerId} />
      <input type="hidden" name="ledgerType" value={ledgerType} />
      <input type="hidden" name="createdBy" value={createdBy} />
      <input type="hidden" name="sourceType" value={draft.sourceType} />
      <input type="hidden" name="sourceReferenceId" value={draft.sourceReferenceId ?? ""} />
      <input type="hidden" name="debitAmount" value={debitLine.amount} />
      <input type="hidden" name="creditAmount" value={creditLine.amount} />

      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>仕訳日</span>
          <Input type="date" name="journalDate" defaultValue={draft.journalDate} required />
        </label>
        <label className="space-y-1 text-sm">
          <span>摘要</span>
          <Input name="description" defaultValue={draft.description} required />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-sm font-semibold">借方</p>
          <Select name="debitAccountId" defaultValue={debitLine.accountId ?? ""} required>
            <option value="">科目を選択</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.code} {account.name}</option>
            ))}
          </Select>
          <Select name="debitTaxCode" defaultValue={debitLine.taxCode ?? "OUT_OF_SCOPE"}>
            {DEFAULT_TAX_CODES.map((tax) => (
              <option key={tax.code} value={tax.code}>{tax.label}</option>
            ))}
          </Select>
          <p className="text-xs text-foreground/70">金額: ¥{debitLine.amount.toLocaleString()}</p>
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-sm font-semibold">貸方</p>
          <Select name="creditAccountId" defaultValue={creditLine.accountId ?? ""} required>
            <option value="">科目を選択</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.code} {account.name}</option>
            ))}
          </Select>
          <Select name="creditTaxCode" defaultValue={creditLine.taxCode ?? "OUT_OF_SCOPE"}>
            {DEFAULT_TAX_CODES.map((tax) => (
              <option key={tax.code} value={tax.code}>{tax.label}</option>
            ))}
          </Select>
          <p className="text-xs text-foreground/70">金額: ¥{creditLine.amount.toLocaleString()}</p>
        </div>
      </div>

      <p className="text-sm">貸借一致: {balance.isBalanced ? "一致" : "不一致"}（借方 ¥{balance.totalDebit.toLocaleString()} / 貸方 ¥{balance.totalCredit.toLocaleString()}）</p>

      {draft.warnings.length > 0 ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
          {draft.warnings.map((warning) => <p key={warning}>- {warning}</p>)}
        </div>
      ) : null}

      {state.message ? <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-rose-600"}`}>{state.message}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? "保存中..." : "仕訳を保存"}</Button>
    </form>
  );
};
