"use server";

import { revalidatePath } from "next/cache";
import { saveJournalDraft } from "@/lib/accounting/service";
import { LedgerType } from "@/types/domain";

export interface SaveJournalState {
  ok: boolean;
  message: string;
}

export const initialSaveJournalState: SaveJournalState = {
  ok: false,
  message: "",
};

export const saveJournalAction = async (_prevState: SaveJournalState, formData: FormData): Promise<SaveJournalState> => {
  try {
    const householdId = String(formData.get("householdId") ?? "");
    const ledgerId = String(formData.get("ledgerId") ?? "");
    const ledgerType = String(formData.get("ledgerType") ?? "family") as LedgerType;
    const createdBy = String(formData.get("createdBy") ?? "");
    const sourceType = String(formData.get("sourceType") ?? "transaction") as "manual" | "transaction" | "bank" | "ocr";
    const sourceReferenceId = String(formData.get("sourceReferenceId") ?? "") || null;
    const journalDate = String(formData.get("journalDate") ?? "");
    const description = String(formData.get("description") ?? "");
    const debitAccountId = String(formData.get("debitAccountId") ?? "");
    const creditAccountId = String(formData.get("creditAccountId") ?? "");
    const debitAmount = Number(formData.get("debitAmount") ?? 0);
    const creditAmount = Number(formData.get("creditAmount") ?? 0);
    const debitTaxCode = String(formData.get("debitTaxCode") ?? "") || null;
    const creditTaxCode = String(formData.get("creditTaxCode") ?? "") || null;

    await saveJournalDraft({
      householdId,
      ledgerId,
      ledgerType,
      createdBy,
      sourceType,
      sourceReferenceId,
      journalDate,
      description,
      debitAccountId,
      debitAmount,
      debitTaxCode,
      creditAccountId,
      creditAmount,
      creditTaxCode,
    });

    revalidatePath("/accounting/journals");
    return { ok: true, message: "仕訳を保存しました" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "仕訳保存に失敗しました",
    };
  }
};
