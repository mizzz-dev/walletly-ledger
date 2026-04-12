import { buildJournalExportRows, toGenericJournalCsv } from "@/lib/accounting/export/journal-csv";
import { mapJournalRowsByFormat } from "@/lib/accounting/export/format-mapper";
import { listAccountsByLedger } from "@/lib/accounting/repositories/accounting-repository";
import { JournalLineReportRecord, listJournalLineRecordsByPeriod } from "@/lib/accounting/repositories/reporting-repository";
import { buildGeneralLedgerRows } from "@/lib/accounting/reports/general-ledger";
import { buildAccountSummary } from "@/lib/accounting/reports/account-summary";
import { buildTaxSummary } from "@/lib/accounting/reports/tax-summary";
import { buildTrialBalance } from "@/lib/accounting/reports/trial-balance";
import { assertWorkLedger } from "@/lib/accounting/reports/scope";
import { ExportFormat, LedgerType } from "@/types/domain";

export const normalizeAccountingDateRange = ({ dateFrom, dateTo }: { dateFrom?: string; dateTo?: string }) => {
  const today = new Date().toISOString().slice(0, 10);
  const from = dateFrom && /^\d{4}-\d{2}-\d{2}$/.test(dateFrom) ? dateFrom : `${today.slice(0, 4)}-01-01`;
  const to = dateTo && /^\d{4}-\d{2}-\d{2}$/.test(dateTo) ? dateTo : today;

  if (from > to) {
    throw new Error("期間指定が不正です（開始日が終了日を超えています）");
  }

  return { dateFrom: from, dateTo: to };
};

const resolveRecords = async ({
  householdId,
  ledgerId,
  ledgerType,
  dateFrom,
  dateTo,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ records: JournalLineReportRecord[]; dateFrom: string; dateTo: string }> => {
  assertWorkLedger(ledgerType);
  const normalized = normalizeAccountingDateRange({ dateFrom, dateTo });
  const records = await listJournalLineRecordsByPeriod({
    householdId,
    ledgerId,
    dateFrom: normalized.dateFrom,
    dateTo: normalized.dateTo,
  });

  return { records, ...normalized };
};

export const getAccountingExportOverview = async ({
  householdId,
  ledgerId,
  ledgerType,
  dateFrom,
  dateTo,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { records, dateFrom: normalizedDateFrom, dateTo: normalizedDateTo } = await resolveRecords({ householdId, ledgerId, ledgerType, dateFrom, dateTo });

  return {
    dateFrom: normalizedDateFrom,
    dateTo: normalizedDateTo,
    lineCount: records.length,
    taxSummary: buildTaxSummary(records),
  };
};

export const exportJournalsCsv = async ({
  householdId,
  ledgerId,
  ledgerType,
  dateFrom,
  dateTo,
  format,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  dateFrom?: string;
  dateTo?: string;
  format: ExportFormat;
}) => {
  const { records, dateFrom: normalizedDateFrom, dateTo: normalizedDateTo } = await resolveRecords({ householdId, ledgerId, ledgerType, dateFrom, dateTo });
  const rows = buildJournalExportRows(records);
  const mappedRows = mapJournalRowsByFormat({ format, rows });

  return {
    dateFrom: normalizedDateFrom,
    dateTo: normalizedDateTo,
    csv: toGenericJournalCsv(mappedRows),
    rowCount: mappedRows.length,
  };
};

export const getTrialBalanceReport = async ({
  householdId,
  ledgerId,
  ledgerType,
  dateFrom,
  dateTo,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { records, dateFrom: normalizedDateFrom, dateTo: normalizedDateTo } = await resolveRecords({ householdId, ledgerId, ledgerType, dateFrom, dateTo });
  return {
    dateFrom: normalizedDateFrom,
    dateTo: normalizedDateTo,
    ...buildTrialBalance(records),
  };
};

export const getAccountSummaryReport = async ({
  householdId,
  ledgerId,
  ledgerType,
  dateFrom,
  dateTo,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { records, dateFrom: normalizedDateFrom, dateTo: normalizedDateTo } = await resolveRecords({ householdId, ledgerId, ledgerType, dateFrom, dateTo });
  return {
    dateFrom: normalizedDateFrom,
    dateTo: normalizedDateTo,
    rows: buildAccountSummary(records),
  };
};

export const getGeneralLedgerReport = async ({
  householdId,
  ledgerId,
  ledgerType,
  accountCode,
  dateFrom,
  dateTo,
}: {
  householdId: string;
  ledgerId: string;
  ledgerType: LedgerType;
  accountCode: string;
  dateFrom?: string;
  dateTo?: string;
}) => {
  const { records, dateFrom: normalizedDateFrom, dateTo: normalizedDateTo } = await resolveRecords({ householdId, ledgerId, ledgerType, dateFrom, dateTo });
  const accounts = await listAccountsByLedger({ householdId, ledgerId });

  return {
    dateFrom: normalizedDateFrom,
    dateTo: normalizedDateTo,
    accounts,
    rows: buildGeneralLedgerRows({ records, accountCode }),
  };
};
