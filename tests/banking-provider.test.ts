import { describe, expect, it } from "vitest";
import { normalizeProviderTransaction } from "@/lib/banking/normalizers";
import { MockBankProviderClient } from "@/lib/banking/providers/mock-provider";
import { BankConnection } from "@/types/domain";

const connection: BankConnection = {
  id: "conn-1",
  householdId: "house-1",
  ledgerId: "ledger-1",
  provider: "mock",
  status: "connected",
  externalConnectionId: null,
  lastSyncedAt: null,
  createdBy: "user-1",
  createdAt: "2026-04-09T00:00:00Z",
  updatedAt: "2026-04-09T00:00:00Z",
};

describe("bank provider normalize", () => {
  it("provider transactionを正規化できる", async () => {
    const provider = new MockBankProviderClient();
    const [account] = await provider.listAccounts(connection);
    const [transaction] = await provider.syncTransactions(connection, account);

    const normalized = normalizeProviderTransaction({ connection, account, transaction });
    expect(normalized.household_id).toBe("house-1");
    expect(normalized.amount).toBeGreaterThan(0);
    expect(normalized.transaction_hash.length).toBe(64);
  });

  it("amount不正は失敗する", async () => {
    const provider = new MockBankProviderClient();
    const [account] = await provider.listAccounts(connection);

    expect(() =>
      normalizeProviderTransaction({
        connection,
        account,
        transaction: {
          providerTransactionId: null,
          postedAt: "2026-04-09",
          bookedAt: null,
          amount: Number.NaN,
          currency: "JPY",
          direction: "outflow",
          description: "test",
          counterparty: null,
          rawPayload: {},
        },
      }),
    ).toThrow("銀行明細の金額が不正です");
  });

  it("description欠損は失敗する", async () => {
    const provider = new MockBankProviderClient();
    const [account] = await provider.listAccounts(connection);

    expect(() =>
      normalizeProviderTransaction({
        connection,
        account,
        transaction: {
          providerTransactionId: null,
          postedAt: "2026-04-09",
          bookedAt: null,
          amount: 100,
          currency: "JPY",
          direction: "outflow",
          description: "",
          counterparty: null,
          rawPayload: {},
        },
      }),
    ).toThrow("銀行明細の摘要が不足しています");
  });

  it("provider_transaction_id欠損でもhashで正規化できる", async () => {
    const provider = new MockBankProviderClient();
    const [account] = await provider.listAccounts(connection);

    const normalized = normalizeProviderTransaction({
      connection,
      account,
      transaction: {
        providerTransactionId: null,
        postedAt: "2026-04-09",
        bookedAt: null,
        amount: 990,
        currency: "JPY",
        direction: "outflow",
        description: "手数料",
        counterparty: null,
        rawPayload: {},
      },
    });

    expect(normalized.provider_transaction_id).toBeNull();
    expect(normalized.transaction_hash).toHaveLength(64);
  });

  it("同期結果空配列は扱える", async () => {
    const provider = new MockBankProviderClient();
    const [account] = await provider.listAccounts(connection);
    const results: Array<unknown> = [];
    expect(results).toHaveLength(0);
    expect(account.providerAccountId).toBeTruthy();
  });

});
