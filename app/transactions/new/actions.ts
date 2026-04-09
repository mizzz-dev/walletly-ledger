"use server";

import { revalidatePath } from "next/cache";
import { MockOcrProvider, extractReceiptDraftWithProvider } from "@/lib/ocr/receipt-service";
import { generateBudgetNotificationsOnTransactionSaved } from "@/lib/notifications/service";
import { createReceiptAttachment, updateReceiptAttachmentOcr } from "@/lib/repositories/receipt-repository";
import { createExpenseTransaction } from "@/lib/transaction-service";
import { ReceiptDraft } from "@/types/domain";

export interface SaveTransactionState {
  ok: boolean;
  message: string;
}

export interface GenerateReceiptDraftState {
  ok: boolean;
  message: string;
  draft: ReceiptDraft | null;
  receiptAttachmentId: string | null;
}

export const initialSaveTransactionState: SaveTransactionState = {
  ok: false,
  message: "",
};

export const initialGenerateReceiptDraftState: GenerateReceiptDraftState = {
  ok: false,
  message: "",
  draft: null,
  receiptAttachmentId: null,
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
    const receiptAttachmentId = String(formData.get("receiptAttachmentId") ?? "") || null;
    const importedBankTransactionId = String(formData.get("importedBankTransactionId") ?? "") || null;

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
      receiptAttachmentId,
      importedBankTransactionId,
    });
    await generateBudgetNotificationsOnTransactionSaved({
      householdId,
      ledgerId,
      transactionDate,
    });

    revalidatePath("/transactions");
    revalidatePath("/settlements");
    revalidatePath("/notifications");

    return { ok: true, message: "支出を保存しました" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "支出の保存に失敗しました";
    return { ok: false, message };
  }
};

export const generateReceiptDraftAction = async (formData: FormData): Promise<GenerateReceiptDraftState> => {
  const householdId = String(formData.get("householdId") ?? "");
  const ledgerId = String(formData.get("ledgerId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const file = formData.get("receiptImage");

  if (!(file instanceof File)) {
    return { ...initialGenerateReceiptDraftState, message: "画像ファイルが見つかりませんでした" };
  }

  let attachmentId: string | null = null;

  try {
    const attachment = await createReceiptAttachment({
      householdId,
      ledgerId,
      uploadedBy: userId,
      file,
    });
    attachmentId = attachment.id;

    const { draft, ocrResult } = await extractReceiptDraftWithProvider({
      file,
      provider: new MockOcrProvider(),
    });

    await updateReceiptAttachmentOcr({
      attachmentId: attachment.id,
      rawText: ocrResult.rawText,
      confidence: ocrResult.confidence,
      status: "completed",
    });

    return {
      ok: true,
      message: "OCR候補を生成しました。内容を確認してから保存してください。",
      draft,
      receiptAttachmentId: attachment.id,
    };
  } catch (error) {
    if (attachmentId) {
      try {
        await updateReceiptAttachmentOcr({
          attachmentId,
          rawText: "",
          confidence: null,
          status: "failed",
        });
      } catch {
        // 二次障害は握りつぶし、元エラーを優先して返す
      }
    }

    const message = error instanceof Error ? error.message : "OCR候補の生成に失敗しました";
    return { ...initialGenerateReceiptDraftState, message };
  }
};
