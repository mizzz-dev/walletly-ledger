"use server";

import { revalidatePath } from "next/cache";
import { createExpenseTransaction } from "@/lib/transaction-service";

export interface ReviewImportState {
  ok: boolean;
  message: string;
}

export const initialReviewImportState: ReviewImportState = {
  ok: false,
  message: "",
};

export const importReviewedBankDraftAction = async (
  _prevState: ReviewImportState,
  formData: FormData,
): Promise<ReviewImportState> => {
  try {
    const householdId = String(formData.get("householdId") ?? "");
    const ledgerId = String(formData.get("ledgerId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    const payerMembershipId = String(formData.get("payerMembershipId") ?? "");
    const categoryId = String(formData.get("categoryId") ?? "");
    const amount = Number(formData.get("amount") ?? 0);
    const note = String(formData.get("note") ?? "");
    const merchant = String(formData.get("merchant") ?? "");
    const transactionDate = String(formData.get("transactionDate") ?? "");
    const bankTransactionId = String(formData.get("bankTransactionId") ?? "");
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
      currency: "JPY",
      note,
      merchant,
      transactionDate,
      createdBy: userId,
      appliedPresetId,
      splitResults,
      validMemberIds,
      importedBankTransactionId: bankTransactionId,
      sourceType: "bank",
      sourceReferenceId: bankTransactionId,
    });

    revalidatePath("/banking/review");
    revalidatePath("/banking/transactions");
    revalidatePath("/transactions");

    return { ok: true, message: "銀行明細候補を取引として登録しました" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "登録に失敗しました";
    return { ok: false, message };
  }
};
