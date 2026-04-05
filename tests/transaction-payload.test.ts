import { describe, expect, it } from "vitest";
import { toSplitInsertPayloads, toTransactionInsertPayload } from "@/lib/transactions/payload";

describe("transaction payload", () => {
  const baseInput = {
    householdId: "hh1",
    ledgerId: "ld1",
    payerMembershipId: "m1",
    categoryId: "c1",
    amount: 1200,
    currency: "JPY",
    note: "  買い物  ",
    merchant: "  スーパー  ",
    transactionDate: "2026-04-05",
    createdBy: "u1",
    appliedPresetId: "p1",
    splitResults: [
      { memberId: "m1", amount: 600 },
      { memberId: "m2", amount: 600 },
    ],
    validMemberIds: ["m1", "m2"],
  };

  it("取引保存payloadを整形できる", () => {
    const payload = toTransactionInsertPayload(baseInput);
    expect(payload.note).toBe("買い物");
    expect(payload.merchant).toBe("スーパー");
    expect(payload.transaction_date).toBe("2026-04-05");
  });

  it("split保存payloadを整形できる", () => {
    const rows = toSplitInsertPayloads({
      householdId: "hh1",
      ledgerId: "ld1",
      transactionId: "tx1",
      splitResults: baseInput.splitResults,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0].member_id).toBe("m1");
    expect(rows[0].transaction_id).toBe("tx1");
  });

  it("split合計が一致しないと失敗する", () => {
    expect(() =>
      toTransactionInsertPayload({
        ...baseInput,
        splitResults: [
          { memberId: "m1", amount: 500 },
          { memberId: "m2", amount: 600 },
        ],
      }),
    ).toThrow("分担金額の合計が支出金額と一致しません");
  });

  it("対象メンバーが不正だと失敗する", () => {
    expect(() =>
      toTransactionInsertPayload({
        ...baseInput,
        splitResults: [{ memberId: "m3", amount: 1200 }],
      }),
    ).toThrow("分担対象メンバーが不正です");
  });

  it("金額不正だと失敗する", () => {
    expect(() => toTransactionInsertPayload({ ...baseInput, amount: 0 })).toThrow("金額は0より大きい値を入力してください");
  });
});
