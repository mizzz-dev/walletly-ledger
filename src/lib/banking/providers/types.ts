import { BankAccountType, BankConnection, BankProvider, BankTransactionDirection } from "@/types/domain";

export interface ProviderAccount {
  providerAccountId: string;
  displayName: string;
  accountType: BankAccountType;
  currency: string;
  maskedAccountNumber: string | null;
  isShared: boolean;
}

export interface ProviderTransaction {
  providerTransactionId: string | null;
  postedAt: string;
  bookedAt: string | null;
  amount: number;
  currency: string;
  direction: BankTransactionDirection;
  description: string;
  counterparty: string | null;
  rawPayload: Record<string, unknown>;
}

export interface BankProviderClient {
  provider: BankProvider;
  listAccounts: (connection: BankConnection) => Promise<ProviderAccount[]>;
  syncTransactions: (connection: BankConnection, account: ProviderAccount) => Promise<ProviderTransaction[]>;
}
