import { NextRequest } from "next/server";
import { resolveAppContext } from "@/lib/context/app-context";
import { exportJournalsCsv } from "@/lib/accounting/reporting-service";
import { ExportFormat } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const householdId = searchParams.get("householdId") ?? undefined;
  const ledgerId = searchParams.get("ledgerId") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const format = (searchParams.get("format") as ExportFormat | null) ?? "generic_csv";

  const context = await resolveAppContext({ householdId, ledgerId });

  if (!context.currentHouseholdId || !context.currentLedgerId || !context.userId) {
    return new Response("エクスポート対象の台帳を解決できませんでした", { status: 400 });
  }

  const currentLedger = context.ledgers.find((ledger) => ledger.id === context.currentLedgerId);
  if (!currentLedger || currentLedger.type !== "work") {
    return new Response("work台帳以外ではCSVエクスポートできません", { status: 403 });
  }

  const membership = context.members.find((member) => member.userId === context.userId);
  const canExport = membership?.role === "owner" || membership?.role === "editor";
  if (!canExport) {
    return new Response("CSVエクスポートには owner/editor 権限が必要です", { status: 403 });
  }

  try {
    const exported = await exportJournalsCsv({
      householdId: context.currentHouseholdId,
      ledgerId: context.currentLedgerId,
      ledgerType: currentLedger.type,
      dateFrom,
      dateTo,
      format,
    });

    const filename = `journal_export_${exported.dateFrom}_${exported.dateTo}.csv`;
    return new Response(exported.csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=${filename}`,
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "CSVエクスポートに失敗しました", { status: 400 });
  }
}
