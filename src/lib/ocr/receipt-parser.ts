import { ReceiptDraft, ReceiptOcrResult } from "@/types/domain";
import {
  buildMemoCandidate,
  extractAmountCandidates,
  extractDateCandidates,
  extractLineItems,
  extractMerchantCandidate,
  extractPaymentMethod,
} from "@/lib/ocr/normalizers";

export const toReceiptOcrResult = ({
  rawText,
  confidence,
}: {
  rawText: string;
  confidence?: number | null;
}): ReceiptOcrResult => {
  const amountCandidates = extractAmountCandidates(rawText);
  const dateCandidates = extractDateCandidates(rawText);

  return {
    totalAmount: amountCandidates[0] ?? null,
    date: dateCandidates[0] ?? null,
    merchantName: extractMerchantCandidate(rawText),
    taxAmount: null,
    paymentMethod: extractPaymentMethod(rawText),
    rawText,
    confidence: confidence ?? null,
    lineItems: extractLineItems(rawText),
    amountCandidates,
    dateCandidates,
  };
};

export const toReceiptDraft = (ocrResult: ReceiptOcrResult): ReceiptDraft => {
  return {
    amount: ocrResult.totalAmount,
    transactionDate: ocrResult.date,
    merchantName: ocrResult.merchantName,
    noteCandidate: buildMemoCandidate(ocrResult.rawText),
    rawText: ocrResult.rawText,
    confidence: ocrResult.confidence,
    categorySuggestion: null,
    paymentMethod: ocrResult.paymentMethod,
  };
};
