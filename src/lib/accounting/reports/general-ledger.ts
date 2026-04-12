import { LedgerReportRow } from "@/types/domain";
import { JournalLineReportRecord } from "@/lib/accounting/repositories/reporting-repository";

export const buildGeneralLedgerRows = ({
  records,
  accountCode,
}: {
  records: JournalLineReportRecord[];
  accountCode: string;
}): LedgerReportRow[] => {
  const targetLines = records
    .filter((record) => record.accountCode === accountCode)
    .sort((a, b) => a.journalDate.localeCompare(b.journalDate) || a.lineNo - b.lineNo);

  const groupedByJournal = records.reduce<Map<string, JournalLineReportRecord[]>>((map, record) => {
    const current = map.get(record.journalId) ?? [];
    current.push(record);
    map.set(record.journalId, current);
    return map;
  }, new Map());

  return targetLines.map((line) => {
    const counterparts = (groupedByJournal.get(line.journalId) ?? []).filter((item) => item.lineId !== line.lineId);

    return {
      journalId: line.journalId,
      journalDate: line.journalDate,
      description: line.description,
      lineNo: line.lineNo,
      dc: line.dc,
      accountCode: line.accountCode,
      accountName: line.accountName,
      counterpartAccountCodes: counterparts.map((item) => item.accountCode),
      counterpartAccountNames: counterparts.map((item) => item.accountName),
      amount: line.amount,
      taxCode: line.taxCode,
      memo: line.memo,
      sourceType: line.sourceType,
      sourceReferenceId: line.sourceReferenceId,
    };
  });
};
