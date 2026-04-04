import { describe, expect, it } from "vitest";
import { calculateSplit, validateMemberCount } from "@/lib/split";

describe("calculateSplit", () => {
  it("等分", () => {
    const result = calculateSplit({ amount: 900, method: "equal", members: [{ memberId: "a" }, { memberId: "b" }, { memberId: "c" }] });
    expect(result.map((r) => r.amount)).toEqual([300, 300, 300]);
  });

  it("比率", () => {
    const result = calculateSplit({ amount: 1000, method: "ratio", members: [{ memberId: "a", ratio: 1 }, { memberId: "b", ratio: 3 }] });
    expect(result.map((r) => r.amount)).toEqual([250, 750]);
  });

  it("重み", () => {
    const result = calculateSplit({ amount: 1200, method: "weight", members: [{ memberId: "a", weight: 2 }, { memberId: "b", weight: 1 }] });
    expect(result.map((r) => r.amount)).toEqual([800, 400]);
  });

  it("固定額混合", () => {
    const result = calculateSplit({ amount: 1000, method: "fixed_mixed", members: [{ memberId: "a", fixedAmount: 400 }, { memberId: "b" }, { memberId: "c" }] });
    expect(result.map((r) => r.amount).reduce((a, b) => a + b, 0)).toBe(1000);
  });

  it("端数処理", () => {
    const result = calculateSplit({ amount: 100, method: "equal", rounding: "floor", members: [{ memberId: "a" }, { memberId: "b" }, { memberId: "c" }] });
    expect(result.reduce((a, b) => a + b.amount, 0)).toBe(100);
  });

  it("不正比率", () => {
    expect(() => calculateSplit({ amount: 1000, method: "ratio", members: [{ memberId: "a", ratio: 0 }, { memberId: "b", ratio: 0 }] })).toThrow();
  });

  it("負の金額", () => {
    expect(() => calculateSplit({ amount: -1, method: "equal", members: [{ memberId: "a" }] })).toThrow();
  });

  it("固定額超過", () => {
    expect(() => calculateSplit({ amount: 100, method: "fixed_mixed", members: [{ memberId: "a", fixedAmount: 80 }, { memberId: "b", fixedAmount: 30 }] })).toThrow();
  });

  it("メンバー数不一致", () => {
    expect(() => validateMemberCount(3, [{ memberId: "a" }, { memberId: "b" }])).toThrow();
  });
});
