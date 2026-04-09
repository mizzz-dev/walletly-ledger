import { describe, expect, it } from "vitest";
import { MockOcrProvider, extractReceiptDraftWithProvider, validateReceiptImageFile } from "@/lib/ocr/receipt-service";
import { toReceiptDraft } from "@/lib/ocr/receipt-parser";

describe("receipt draft", () => {
  it("OCR結果から下書きを生成できる", () => {
    const draft = toReceiptDraft({
      totalAmount: 1280,
      date: "2026-04-09",
      merchantName: "サンプル商店",
      taxAmount: null,
      paymentMethod: "クレジット",
      rawText: "サンプル商店 合計1280",
      confidence: 0.55,
      lineItems: [],
      amountCandidates: [1280],
      dateCandidates: ["2026-04-09"],
    });

    expect(draft.amount).toBe(1280);
    expect(draft.transactionDate).toBe("2026-04-09");
    expect(draft.merchantName).toBe("サンプル商店");
    expect(draft.rawText).toContain("合計1280");
  });

  it("不完全なOCR結果でも下書きは生成できる", () => {
    const draft = toReceiptDraft({
      totalAmount: null,
      date: null,
      merchantName: null,
      taxAmount: null,
      paymentMethod: null,
      rawText: "", 
      confidence: null,
      lineItems: [],
      amountCandidates: [],
      dateCandidates: [],
    });

    expect(draft.amount).toBeNull();
    expect(draft.transactionDate).toBeNull();
    expect(draft.merchantName).toBeNull();
  });

  it("mock providerで画像から下書き生成できる", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "sample-receipt.jpg", { type: "image/jpeg" });
    const { draft, ocrResult } = await extractReceiptDraftWithProvider({ file, provider: new MockOcrProvider() });

    expect(draft.amount).toBe(1280);
    expect(draft.transactionDate).toBe("2026-04-09");
    expect(ocrResult.rawText).toContain("sample receipt");
  });

  it("不正なファイル入力は失敗する", () => {
    const file = new File(["hello"], "sample.txt", { type: "text/plain" });
    expect(() => validateReceiptImageFile(file)).toThrow("対応していないファイル形式です");
  });

  it("サイズ超過ファイルは失敗する", () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.jpg", { type: "image/jpeg" });
    expect(() => validateReceiptImageFile(file)).toThrow("ファイルサイズは10MB以下にしてください");
  });
});
