import { BankProviderClient, ProviderAccount, ProviderTransaction } from "@/lib/banking/providers/types";
import { BankConnection } from "@/types/domain";

const today = new Date().toISOString().slice(0, 10);

export class MockBankProviderClient implements BankProviderClient {
  provider = "mock" as const;

  async listAccounts(connection: BankConnection): Promise<ProviderAccount[]> {
    void connection;

    return [
      {
        providerAccountId: "mock-account-main",
        displayName: "モック共有口座",
        accountType: "checking",
        currency: "JPY",
        maskedAccountNumber: "****1234",
        isShared: true,
      },
    ];
  }

  async syncTransactions(connection: BankConnection, account: ProviderAccount): Promise<ProviderTransaction[]> {
    void connection;

    return [
      {
        providerTransactionId: `${account.providerAccountId}-tx-001`,
        postedAt: today,
        bookedAt: today,
        amount: 1280,
        currency: "JPY",
        direction: "outflow",
        description: "スーパー サンプル商店",
        counterparty: "サンプル商店",
        rawPayload: { source: "mock", memo: "買い物" },
      },
      {
        providerTransactionId: `${account.providerAccountId}-tx-002`,
        postedAt: today,
        bookedAt: null,
        amount: 85000,
        currency: "JPY",
        direction: "inflow",
        description: "給与振込",
        counterparty: "サンプル株式会社",
        rawPayload: { source: "mock", memo: "入金" },
      },
    ];
  }
}
