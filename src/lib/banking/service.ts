import { toImportedTransactionCandidate } from "@/lib/banking/candidates";
import { normalizeProviderTransaction } from "@/lib/banking/normalizers";
import { resolveBankProvider } from "@/lib/banking/providers";
import {
  createBankConnectionRow,
  findMembershipRole,
  getBankConnectionById,
  listBankAccountsByScope,
  listBankConnectionsByScope,
  listBankTransactionsByScope,
  upsertBankAccounts,
  upsertBankTransactions,
  updateConnectionSyncStatus,
} from "@/lib/banking/repositories/banking-repository";
import { BankAccount, BankConnection, BankProvider, ImportedTransactionCandidate } from "@/types/domain";

const assertEditableRole = (role: string | null) => {
  if (!role) {
    throw new Error("世帯メンバーではないため操作できません");
  }
  if (!['owner', 'editor'].includes(role)) {
    throw new Error("この操作は owner / editor のみ実行できます");
  }
};

export const createBankConnection = async ({
  householdId,
  ledgerId,
  provider,
  userId,
}: {
  householdId: string;
  ledgerId: string | null;
  provider: BankProvider;
  userId: string;
}): Promise<BankConnection> => {
  const role = await findMembershipRole({ householdId, userId });
  assertEditableRole(role);

  return createBankConnectionRow({
    householdId,
    ledgerId,
    provider,
    createdBy: userId,
  });
};

export const syncBankConnection = async ({
  connectionId,
  householdId,
  userId,
}: {
  connectionId: string;
  householdId: string;
  userId: string;
}) => {
  const role = await findMembershipRole({ householdId, userId });
  assertEditableRole(role);

  const connection = await getBankConnectionById(connectionId);
  if (!connection || connection.householdId !== householdId) {
    throw new Error("対象の銀行接続が見つかりません");
  }

  const provider = resolveBankProvider(connection.provider);

  try {
    const providerAccounts = await provider.listAccounts(connection);
    const savedAccounts = await upsertBankAccounts({
      connection,
      accounts: providerAccounts.map((account) => ({
        provider_account_id: account.providerAccountId,
        display_name: account.displayName,
        account_type: account.accountType,
        currency: account.currency,
        masked_account_number: account.maskedAccountNumber,
        is_shared: account.isShared,
      })),
    });

    const accountMap = new Map<string, BankAccount>();
    savedAccounts.forEach((account) => {
      accountMap.set(account.providerAccountId, account);
    });

    for (const providerAccount of providerAccounts) {
      const saved = accountMap.get(providerAccount.providerAccountId);
      if (!saved) continue;

      const rawTransactions = await provider.syncTransactions(connection, providerAccount);
      const normalized = rawTransactions.map((transaction) =>
        normalizeProviderTransaction({ connection, account: providerAccount, transaction }),
      );

      await upsertBankTransactions({
        bankAccountId: saved.id,
        rows: normalized,
      });
    }

    await updateConnectionSyncStatus({ connectionId: connection.id, status: "connected" });
  } catch (error) {
    await updateConnectionSyncStatus({ connectionId: connection.id, status: "error" });
    throw error;
  }
};

export const listBankingOverview = async ({
  householdId,
  ledgerId,
}: {
  householdId: string;
  ledgerId: string | null;
}) => {
  const [connections, accounts, transactions] = await Promise.all([
    listBankConnectionsByScope({ householdId, ledgerId }),
    listBankAccountsByScope({ householdId, ledgerId }),
    listBankTransactionsByScope({ householdId, ledgerId, onlyUnimported: false }),
  ]);

  return {
    connections,
    accounts,
    transactions,
  };
};

export const listBankTransactionCandidates = async ({
  householdId,
  ledgerId,
  accountId,
  onlyUnimported,
}: {
  householdId: string;
  ledgerId: string | null;
  accountId?: string;
  onlyUnimported?: boolean;
}): Promise<Array<ImportedTransactionCandidate & { accountDisplayName: string }>> => {
  const rows = await listBankTransactionsByScope({ householdId, ledgerId, accountId, onlyUnimported });
  return rows.map((row) => ({
    ...toImportedTransactionCandidate({
      id: row.id,
      amount: row.amount,
      postedAt: row.postedAt,
      description: row.description,
      counterparty: row.counterparty,
      direction: row.direction,
      importedTransactionId: row.importedTransactionId,
    }),
    accountDisplayName: row.accountDisplayName,
    direction: row.direction,
  }));
};
