import { BankProviderClient } from "@/lib/banking/providers/types";
import { MockBankProviderClient } from "@/lib/banking/providers/mock-provider";
import { BankProvider } from "@/types/domain";

const unsupportedProvider = (provider: BankProvider): BankProviderClient => ({
  provider,
  async listAccounts() {
    throw new Error(`${provider} provider は未実装です`);
  },
  async syncTransactions() {
    throw new Error(`${provider} provider は未実装です`);
  },
});

export const resolveBankProvider = (provider: BankProvider): BankProviderClient => {
  switch (provider) {
    case "mock":
      return new MockBankProviderClient();
    case "minna_bank":
    case "aggregator":
      return unsupportedProvider(provider);
    default:
      throw new Error("未対応の銀行providerです");
  }
};
