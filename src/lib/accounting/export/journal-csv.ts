import { JournalExportRow } from "@/types/domain";
import { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";

const JOURNAL_CSV_HEADERS = [
  "journal_date",
  "description",
  "line_no",
  "debit_account_code",
  "debit_account_name",
  "credit_account_code",
  "credit_account_name",
  "amount",
  "tax_code",
  "memo",
  "source_type",
  "source_reference_id",
] as const;

const escapeCsvValue = (value: string): string => {
  const escaped = value.replaceAll('"', '""');
  return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
};

const stringifyRow = (values: Array<string | number | null>): string => values.map((value) => escapeCsvValue(value == null ? "" : String(value))).join(",");

export const buildJournalExportRows = (records: JournalLineReportRecord[]): JournalExportRow[] => {
  const groupedByJournal = records.reduce<Map<string, JournalLineReportRecord[]>>((map, record) => {
    const current = map.get(record.journalId) ?? [];
    current.push(record);
    map.set(record.journalId, current);
    return map;
  }, new Map());

  const rows: JournalExportRow[] = [];

  for (const record of records) {
    const journalLines = groupedByJournal.get(record.journalId) ?? [];
    if (journalLines.length < 2) {
      throw new Error(`仕訳 ${record.journalId} の行数が不足しています`);
    }

    const counterpartLines = journalLines.filter((line) => line.lineId !== record.lineId && line.dc !== record.dc);
    if (counterpartLines.length === 0) {
      throw new Error(`仕訳 ${record.journalId} の貸借行が不整合です`);
    }

    if (record.dc === "debit") {
      rows.push({
        journalDate: record.journalDate,
        description: record.description,
        lineNo: record.lineNo,
        debitAccountCode: record.accountCode,
        debitAccountName: record.accountName,
        creditAccountCode: counterpartLines.map((line) => line.accountCode).join("|"),
        creditAccountName: counterpartLines.map((line) => line.accountName).join("|"),
        amount: record.amount,
        taxCode: record.taxCode,
        memo: record.memo,
        sourceType: record.sourceType,
        sourceReferenceId: record.sourceReferenceId,
      });
      continue;
    }

    rows.push({
      journalDate: record.journalDate,
      description: record.description,
      lineNo: record.lineNo,
      debitAccountCode: counterpartLines.map((line) => line.accountCode).join("|"),
      debitAccountName: counterpartLines.map((line) => line.accountName).join("|"),
      creditAccountCode: record.accountCode,
      creditAccountName: record.accountName,
      amount: record.amount,
      taxCode: record.taxCode,
      memo: record.memo,
      sourceType: record.sourceType,
      sourceReferenceId: record.sourceReferenceId,
    });
  }

  return rows.sort((a, b) => a.journalDate.localeCompare(b.journalDate) || a.lineNo - b.lineNo);
};

export const toGenericJournalCsv = (rows: JournalExportRow[]): string => {
  const header = JOURNAL_CSV_HEADERS.join(",");
  const body = rows.map((row) =>
    stringifyRow([
      row.journalDate,
      row.description,
      row.lineNo,
      row.debitAccountCode,
      row.debitAccountName,
      row.creditAccountCode,
      row.creditAccountName,
      row.amount,
      row.taxCode,
      row.memo,
      row.sourceType,
      row.sourceReferenceId,
    ]),
  );

  return [header, ...body].join("\n");
};

export const JOURNAL_CSV_ENCODING = "UTF-8";
export const JOURNAL_CSV_COLUMN_ORDER = [...JOURNAL_CSV_HEADERS];
