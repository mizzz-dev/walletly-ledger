import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { buildReceiptStoragePath } from "@/lib/ocr/receipt-service";

const RECEIPT_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_RECEIPT_BUCKET ?? "receipt-attachments";

export interface CreateReceiptAttachmentInput {
  householdId: string;
  ledgerId: string;
  uploadedBy: string;
  file: File;
}

export interface ReceiptAttachmentRow {
  id: string;
  household_id: string;
  ledger_id: string;
  transaction_id: string | null;
  uploaded_by: string;
  storage_path: string;
  file_name: string;
  content_type: string;
  file_size: number;
  ocr_status: "pending" | "completed" | "failed";
  ocr_raw_text: string | null;
  ocr_confidence: number | null;
  created_at: string;
}

export const createReceiptAttachment = async ({ householdId, ledgerId, uploadedBy, file }: CreateReceiptAttachmentInput): Promise<ReceiptAttachmentRow> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const storagePath = buildReceiptStoragePath({
    householdId,
    ledgerId,
    uploadedBy,
    fileName: file.name,
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(RECEIPT_BUCKET).upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`画像アップロードに失敗しました: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from("receipt_attachments")
    .insert({
      household_id: householdId,
      ledger_id: ledgerId,
      uploaded_by: uploadedBy,
      storage_path: storagePath,
      file_name: file.name,
      content_type: file.type,
      file_size: file.size,
      ocr_status: "pending",
    })
    .select("id,household_id,ledger_id,transaction_id,uploaded_by,storage_path,file_name,content_type,file_size,ocr_status,ocr_raw_text,ocr_confidence,created_at")
    .single();

  if (error || !data) {
    await supabase.storage.from(RECEIPT_BUCKET).remove([storagePath]);
    throw new Error(`添付レコード保存に失敗しました: ${error?.message ?? "不明なエラー"}`);
  }

  return data as ReceiptAttachmentRow;
};

export const updateReceiptAttachmentOcr = async ({
  attachmentId,
  rawText,
  confidence,
  status,
}: {
  attachmentId: string;
  rawText: string;
  confidence: number | null;
  status: "completed" | "failed";
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { error } = await supabase
    .from("receipt_attachments")
    .update({
      ocr_raw_text: rawText,
      ocr_confidence: confidence,
      ocr_status: status,
    })
    .eq("id", attachmentId);

  if (error) {
    throw new Error(`OCR結果更新に失敗しました: ${error.message}`);
  }
};

export const linkAttachmentToTransaction = async ({
  attachmentId,
  transactionId,
  householdId,
  ledgerId,
}: {
  attachmentId: string;
  transactionId: string;
  householdId: string;
  ledgerId: string;
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { error } = await supabase
    .from("receipt_attachments")
    .update({ transaction_id: transactionId })
    .eq("id", attachmentId)
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId);

  if (error) {
    throw new Error(`添付と取引の紐づけに失敗しました: ${error.message}`);
  }
};
