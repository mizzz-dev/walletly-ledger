import { describe, expect, it } from "vitest";
import { findAccountByCode, suggestExpenseAccountCode, suggestPaymentAccountCode } from "@/lib/accounting/account-mapping";

describe("account mapping", () => {
  it("カテゴリ名から費用科目候補を返す", () => {
    expect(suggestExpenseAccountCode("交通費")).toBe("621");
    expect(suggestExpenseAccountCode("通信費")).toBe("631");
  });

  it("銀行由来は預金系を支払元候補にする", () => {
    expect(suggestPaymentAccountCode("bank")).toBe("111");
    expect(suggestPaymentAccountCode("manual")).toBe("101");
  });

  it("コードから勘定科目を検索できる", () => {
    const account = findAccountByCode(
      [
        { id: "a1", householdId: "h1", ledgerId: "l1", code: "611", name: "消耗品費", category: "expense", isActive: true, sortOrder: 1 },
      ],
      "611",
    );

    expect(account?.name).toBe("消耗品費");
  });
});
