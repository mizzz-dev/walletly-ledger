import { LedgerType } from "@/types/domain";

export const assertWorkLedger = (ledgerType: LedgerType): void => {
  if (ledgerType !== "work") {
    throw new Error("work台帳以外では会計レポートを利用できません");
  }
};
