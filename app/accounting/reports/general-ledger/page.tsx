import { Card } from "@/components/ui/card";
import { SimpleTable } from "@/components/ui/table";
import { resolveAppContext } from "@/lib/context/app-context";
import { getGeneralLedgerReport } from "@/lib/accounting/reporting-service";

export default async function GeneralLedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string; dateFrom?: string; dateTo?: string; accountCode?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または台帳がありません。</p>;
  }

  const currentLedger = context.ledgers.find((ledger) => ledger.id === context.currentLedgerId);
  if (!currentLedger || currentLedger.type !== "work") {
    return (
      <Card>
        <h1 className="text-xl font-bold">総勘定元帳（簡易）</h1>
        <p className="mt-2 text-sm text-foreground/70">work台帳以外では元帳を表示できません。</p>
      </Card>
    );
  }

  const initialReport = await getGeneralLedgerReport({
    householdId: context.currentHouseholdId,
    ledgerId: context.currentLedgerId,
    ledgerType: currentLedger.type,
    accountCode: params.accountCode ?? "",
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  });

  const selectedAccountCode = params.accountCode ?? initialReport.accounts[0]?.code ?? "";
  const report =
    selectedAccountCode && selectedAccountCode !== (params.accountCode ?? "")
      ? await getGeneralLedgerReport({
          householdId: context.currentHouseholdId,
          ledgerId: context.currentLedgerId,
          ledgerType: currentLedger.type,
          accountCode: selectedAccountCode,
          dateFrom: params.dateFrom,
          dateTo: params.dateTo,
        })
      : initialReport;

  return (
    <Card className="space-y-3">
      <h1 className="text-xl font-bold">総勘定元帳（簡易）</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="householdId" value={context.currentHouseholdId} />
        <input type="hidden" name="ledgerId" value={context.currentLedgerId} />
        <label className="text-sm">
          開始日
          <input className="ml-2 rounded-md border border-border px-2 py-1" type="date" name="dateFrom" defaultValue={report.dateFrom} />
        </label>
        <label className="text-sm">
          終了日
          <input className="ml-2 rounded-md border border-border px-2 py-1" type="date" name="dateTo" defaultValue={report.dateTo} />
        </label>
        <label className="text-sm">
          勘定科目
          <select className="ml-2 rounded-md border border-border px-2 py-1" name="accountCode" defaultValue={selectedAccountCode}>
            {report.accounts.map((account) => (
              <option key={account.id} value={account.code}>
                {account.code} {account.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted">表示</button>
      </form>
      {selectedAccountCode.length === 0 ? (
        <p className="text-sm text-foreground/70">表示対象の勘定科目がありません。</p>
      ) : report.rows.length === 0 ? (
        <p className="text-sm text-foreground/70">対象期間に明細がありません。</p>
      ) : (
        <SimpleTable
          headers={["日付", "摘要", "行", "借貸", "金額", "相手科目", "税区分", "元データ"]}
          rows={report.rows.map((row) => [
            row.journalDate,
            row.description,
            String(row.lineNo),
            row.dc === "debit" ? "借方" : "貸方",
            `¥${row.amount.toLocaleString()}`,
            row.counterpartAccountCodes.map((code, index) => `${code} ${row.counterpartAccountNames[index] ?? ""}`).join(" / "),
            row.taxCode ?? "未設定",
            `${row.sourceType ?? "manual"} / ${row.sourceReferenceId ?? "-"}`,
          ])}
        />
      )}
    </Card>
  );
}
