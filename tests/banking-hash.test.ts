import { describe, expect, it } from "vitest";
import { buildBankTransactionHash } from "@/lib/banking/hash";

describe("banking hash", () => {
  it("同一入力なら同一hashを返す", () => {
    const base = {
      provider: "mock",
      providerAccountId: "acc-1",
      providerTransactionId: "tx-1",
      postedAt: "2026-04-09",
      amount: 1200,
      currency: "JPY",
      description: "スーパー サンプル",
      counterparty: "サンプル商店",
    };

    expect(buildBankTransactionHash(base)).toBe(buildBankTransactionHash(base));
  });

  it("descriptionが変わるとhashが変わる", () => {
    const hash1 = buildBankTransactionHash({
      provider: "mock",
      providerAccountId: "acc-1",
      providerTransactionId: null,
      postedAt: "2026-04-09",
      amount: 1200,
      currency: "JPY",
      description: "A",
      counterparty: null,
    });

    const hash2 = buildBankTransactionHash({
      provider: "mock",
      providerAccountId: "acc-1",
      providerTransactionId: null,
      postedAt: "2026-04-09",
      amount: 1200,
      currency: "JPY",
      description: "B",
      counterparty: null,
    });

    expect(hash1).not.toBe(hash2);
  });
});
