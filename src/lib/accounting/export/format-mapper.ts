import { ExportFormat, JournalExportRow } from "@/types/domain";

export const mapJournalRowsByFormat = ({ format, rows }: { format: ExportFormat; rows: JournalExportRow[] }): JournalExportRow[] => {
  switch (format) {
    case "generic_csv":
      return rows;
    case "yayoi_like":
    case "freee_like":
    case "mf_like":
      // 将来の会計ソフト互換列へ変換するための拡張ポイント。
      // 現時点はgeneric CSVと同じ並びで返す。
      return rows;
    default:
      return rows;
  }
};
