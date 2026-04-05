import { describe, expect, it } from "vitest";
import { aggregateMemberNetSummaries, buildSettlementSuggestions } from "@/lib/settlements/aggregation";

describe("settlement aggregation", () => {
  it("取引と分担からnetを計算できる", () => {
    const summaries = aggregateMemberNetSummaries({
      memberIds: ["a", "b", "c"],
      transactions: [
        {
          payerMembershipId: "a",
          amount: 900,
          splits: [
            { memberId: "a", shareAmount: 300 },
            { memberId: "b", shareAmount: 300 },
            { memberId: "c", shareAmount: 300 },
          ],
        },
      ],
      settlements: [],
    });

    expect(summaries.find((row) => row.memberId === "a")?.net).toBe(600);
    expect(summaries.find((row) => row.memberId === "b")?.net).toBe(-300);
    expect(summaries.find((row) => row.memberId === "c")?.net).toBe(-300);
  });

  it("精算記録を反映して未精算netを再計算できる", () => {
    const summaries = aggregateMemberNetSummaries({
      memberIds: ["a", "b", "c"],
      transactions: [
        {
          payerMembershipId: "a",
          amount: 900,
          splits: [
            { memberId: "a", shareAmount: 300 },
            { memberId: "b", shareAmount: 300 },
            { memberId: "c", shareAmount: 300 },
          ],
        },
      ],
      settlements: [{ fromMemberId: "b", toMemberId: "a", amount: 100 }],
    });

    expect(summaries.find((row) => row.memberId === "a")?.net).toBe(500);
    expect(summaries.find((row) => row.memberId === "b")?.net).toBe(-200);
  });

  it("提案生成で残高ゼロ化できる", () => {
    const proposals = buildSettlementSuggestions([
      { memberId: "a", paid: 0, owed: 0, net: 500 },
      { memberId: "b", paid: 0, owed: 0, net: -300 },
      { memberId: "c", paid: 0, owed: 0, net: -200 },
    ]);

    expect(proposals).toEqual([
      { fromMemberId: "b", toMemberId: "a", amount: 300 },
      { fromMemberId: "c", toMemberId: "a", amount: 200 },
    ]);
  });
});
