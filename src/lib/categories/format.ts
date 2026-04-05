import { CategoryOption } from "@/types/domain";

export interface CategoryRow {
  id: string;
  name: string;
  color: string;
  ledger_id: string;
}

export const toCategoryOptions = (rows: CategoryRow[]): CategoryOption[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    ledgerId: row.ledger_id,
  }));
