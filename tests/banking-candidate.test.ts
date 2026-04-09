import { describe, expect, it } from "vitest";
import { inferDirectionFromSignedAmount, toBankTransactionDraft, toImportedTransactionCandidate } from "@/lib/banking/candidates";

describe("banking candidate", () => {
  it("bank transactionから候補を生成できる", () => {
    const candidate = toImportedTransactionCandidate({
      id: "bank-tx-1",
      amount: 2200,
      postedAt: "2026-04-09",
      description: "コンビニ",
      counterparty: "サンプルコンビニ",
      direction: "outflow",
      importedTransactionId: null,
    });

    expect(candidate.matchStatus).toBe("pending");
    expect(candidate.suggestedMerchant).toBe("サンプルコンビニ");

    const draft = toBankTransactionDraft(candidate);
    expect(draft.amount).toBe(2200);
    expect(draft.importedBankTransactionId).toBe("bank-tx-1");
  });

  it("imported_transaction_idがある候補は取込済みになる", () => {
    const candidate = toImportedTransactionCandidate({
      id: "bank-tx-2",
      amount: 1800,
      postedAt: "2026-04-09",
      description: "ランチ",
      counterparty: null,
      direction: "outflow",
      importedTransactionId: "tx-1",
    });

    expect(candidate.matchStatus).toBe("imported");
    expect(candidate.confidence).toBe(0.6);
  });

  it("金額符号から方向を判定できる", () => {
    expect(inferDirectionFromSignedAmount(100)).toBe("outflow");
    expect(inferDirectionFromSignedAmount(-50)).toBe("inflow");
  });

  it("符号なし金額は失敗する", () => {
    expect(() => inferDirectionFromSignedAmount(0)).toThrow("金額の符号から入出金方向を判定できません");
  });
});
