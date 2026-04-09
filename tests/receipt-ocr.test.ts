import { describe, expect, it } from "vitest";
import {
  buildMemoCandidate,
  extractAmountCandidates,
  extractDateCandidates,
  extractMerchantCandidate,
} from "@/lib/ocr/normalizers";
import { toReceiptOcrResult } from "@/lib/ocr/receipt-parser";

describe("receipt ocr normalizers", () => {
  it("合計金額候補を抽出できる", () => {
    const rawText = "コンビニ\n小計 ¥980\n合計 ¥1,078";
    expect(extractAmountCandidates(rawText)).toEqual([1078, 980]);
  });

  it("日付候補を抽出できる", () => {
    const rawText = "購入日 2026/04/08\n発行日 2026年4月9日";
    expect(extractDateCandidates(rawText)).toEqual(["2026-04-08", "2026-04-09"]);
  });

  it("店舗名候補を抽出できる", () => {
    const rawText = "株式会社サンプルストア\n領収書\n合計 1200";
    expect(extractMerchantCandidate(rawText)).toBe("株式会社サンプルストア");
  });

  it("rawText が空なら候補は空になる", () => {
    expect(extractAmountCandidates("  ")).toEqual([]);
    expect(extractDateCandidates("\n")).toEqual([]);
    expect(extractMerchantCandidate("\n\n")).toBeNull();
  });

  it("メモ候補は文字数上限で整形される", () => {
    const memo = buildMemoCandidate("A".repeat(200));
    expect(memo.length).toBe(161);
    expect(memo.endsWith("…")).toBe(true);
  });

  it("OCR結果に候補配列とrawTextを保持する", () => {
    const rawText = "店舗A\n2026/04/09\n合計 ¥2,000";
    const result = toReceiptOcrResult({ rawText, confidence: 0.72 });

    expect(result.totalAmount).toBe(2000);
    expect(result.date).toBe("2026-04-09");
    expect(result.rawText).toBe(rawText);
    expect(result.confidence).toBe(0.72);
    expect(result.amountCandidates[0]).toBe(2000);
  });
});
