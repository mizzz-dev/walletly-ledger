import { describe, expect, it } from "vitest";
import { suggestSettlements } from "@/lib/settlement";

describe("suggestSettlements", () => {
  it("2人ケース", () => {
    const result = suggestSettlements([
      { memberId: "a", paid: 1000, burden: 200 },
      { memberId: "b", paid: 0, burden: 800 },
    ]);
    expect(result).toEqual([{ fromMemberId: "b", toMemberId: "a", amount: 800 }]);
  });

  it("3人ケース", () => {
    const result = suggestSettlements([
      { memberId: "a", paid: 900, burden: 300 },
      { memberId: "b", paid: 0, burden: 300 },
      { memberId: "c", paid: 0, burden: 300 },
    ]);
    expect(result.length).toBe(2);
  });

  it("複数債権者/債務者", () => {
    const result = suggestSettlements([
      { memberId: "a", paid: 1000, burden: 200 },
      { memberId: "b", paid: 700, burden: 300 },
      { memberId: "c", paid: 0, burden: 600 },
      { memberId: "d", paid: 0, burden: 600 },
    ]);
    expect(result.reduce((acc, v) => acc + v.amount, 0)).toBe(1200);
  });
});
