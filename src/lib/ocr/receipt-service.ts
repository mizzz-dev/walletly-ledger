import { randomUUID } from "node:crypto";
import { ReceiptDraft, ReceiptOcrResult } from "@/types/domain";
import { toReceiptDraft, toReceiptOcrResult } from "@/lib/ocr/receipt-parser";

export interface OcrProvider {
  extractText(input: { fileName: string; contentType: string; fileSize: number; imageBuffer: ArrayBuffer }): Promise<{ rawText: string; confidence?: number | null }>;
}

export class MockOcrProvider implements OcrProvider {
  async extractText({ fileName }: { fileName: string; contentType: string; fileSize: number; imageBuffer: ArrayBuffer }) {
    const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "店舗名不明";

    return {
      rawText: `${baseName}\n2026/04/09\n合計 ¥1,280\n支払方法 クレジット`,
      confidence: 0.52,
    };
  }
}

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"] as const;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const validateReceiptImageFile = (file: File) => {
  if (!(file instanceof File)) {
    throw new Error("画像ファイルを選択してください");
  }

  if (!ALLOWED_CONTENT_TYPES.some((type) => file.type.toLowerCase() === type)) {
    throw new Error("対応していないファイル形式です（jpeg/png/webp/heic）");
  }

  if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("ファイルサイズは10MB以下にしてください");
  }
};

const sanitizeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);

const splitNameAndExt = (fileName: string) => {
  const safe = sanitizeFileName(fileName);
  const dotIndex = safe.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === safe.length - 1) {
    return { baseName: safe || "receipt", ext: "jpg" };
  }

  return { baseName: safe.slice(0, dotIndex), ext: safe.slice(dotIndex + 1) };
};

export const buildReceiptStoragePath = ({
  householdId,
  ledgerId,
  uploadedBy,
  fileName,
}: {
  householdId: string;
  ledgerId: string;
  uploadedBy: string;
  fileName: string;
}) => {
  const { baseName, ext } = splitNameAndExt(fileName);
  return `${householdId}/${ledgerId}/${uploadedBy}/${Date.now()}-${randomUUID()}-${baseName}.${ext}`;
};

export const extractReceiptDraftWithProvider = async ({
  file,
  provider,
}: {
  file: File;
  provider: OcrProvider;
}): Promise<{ ocrResult: ReceiptOcrResult; draft: ReceiptDraft }> => {
  validateReceiptImageFile(file);

  const imageBuffer = await file.arrayBuffer();
  const ocrRaw = await provider.extractText({
    fileName: file.name,
    contentType: file.type,
    fileSize: file.size,
    imageBuffer,
  });

  const ocrResult = toReceiptOcrResult({
    rawText: ocrRaw.rawText,
    confidence: ocrRaw.confidence,
  });

  return {
    ocrResult,
    draft: toReceiptDraft(ocrResult),
  };
};
