"use server";

import { revalidatePath } from "next/cache";
import { createExpenseTransaction } from "@/lib/transaction-service";

export interface SaveTransactionState {
  ok: boolean;
  message: string;
}

export const initialSaveTransactionState: SaveTransactionState = {
  ok: false,
  message: "",
};

export const saveTransactionAction = async (
  _prevState: SaveTransactionState,
  formData: FormData,
): Promise<SaveTransactionState> => {
  try {
    const householdId = String(formData.get("householdId") ?? "");
    const ledgerId = String(formData.get("ledgerId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    const payerMembershipId = String(formData.get("payerMembershipId") ?? "");
    const categoryId = String(formData.get("categoryId") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const currency = String(formData.get("currency") ?? "JPY");
    const note = String(formData.get("note") ?? "");
    const merchant = String(formData.get("merchant") ?? "");
    const transactionDate = String(formData.get("transactionDate") ?? "");
    const appliedPresetId = String(formData.get("appliedPresetId") ?? "") || null;

    const splitPayload = String(formData.get("splitPayload") ?? "[]");
    const validMemberIdsPayload = String(formData.get("validMemberIds") ?? "[]");

    const splitResults = JSON.parse(splitPayload) as Array<{ memberId: string; amount: number }>;
    const validMemberIds = JSON.parse(validMemberIdsPayload) as string[];

    await createExpenseTransaction({
      householdId,
      ledgerId,
      payerMembershipId,
      categoryId,
      amount,
      currency,
      note,
      merchant,
      transactionDate,
      createdBy: userId,
      appliedPresetId,
      splitResults,
      validMemberIds,
    });

    revalidatePath("/transactions");
    revalidatePath("/settlements");

    return { ok: true, message: "支出を保存しました" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "支出の保存に失敗しました";
    return { ok: false, message };
  }
};
