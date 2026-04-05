import { describe, expect, it } from "vitest";
import { validateSettlementRecordInput } from "@/lib/settlements/service";

describe("settlement service validation", () => {
  it("amount不正で失敗", () => {
    expect(() =>
      validateSettlementRecordInput({
        fromMemberId: "a",
        toMemberId: "b",
        amount: 0,
        validMemberIds: ["a", "b"],
      }),
    ).toThrow("精算金額は0より大きい値を入力してください");
  });

  it("同一メンバーの精算で失敗", () => {
    expect(() =>
      validateSettlementRecordInput({
        fromMemberId: "a",
        toMemberId: "a",
        amount: 100,
        validMemberIds: ["a", "b"],
      }),
    ).toThrow("同一メンバー間の精算は記録できません");
  });

  it("対象メンバー不正で失敗", () => {
    expect(() =>
      validateSettlementRecordInput({
        fromMemberId: "x",
        toMemberId: "b",
        amount: 100,
        validMemberIds: ["a", "b"],
      }),
    ).toThrow("精算対象メンバーが世帯に存在しません");
  });
});
