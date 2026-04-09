import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { BankAccount, BankConnection, BankProvider, BankTransaction } from "@/types/domain";

interface MembershipRoleRow {
  role: string;
}

interface BankConnectionRow {
  id: string;
  household_id: string;
  ledger_id: string | null;
  provider: BankProvider;
  status: "connected" | "error" | "disconnected" | "pending";
  external_connection_id: string | null;
  last_synced_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface BankAccountRow {
  id: string;
  connection_id: string;
  household_id: string;
  ledger_id: string | null;
  provider_account_id: string;
  display_name: string;
  account_type: "checking" | "savings" | "credit" | "other";
  currency: string;
  masked_account_number: string | null;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

interface BankTransactionRow {
  id: string;
  bank_account_id: string;
  household_id: string;
  ledger_id: string | null;
  provider_transaction_id: string | null;
  posted_at: string;
  booked_at: string | null;
  amount: number;
  currency: string;
  direction: "inflow" | "outflow";
  description: string;
  counterparty: string | null;
  raw_payload: Record<string, unknown>;
  transaction_hash: string;
  imported_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  account?: { display_name: string } | { display_name: string }[] | null;
}

const mapConnection = (row: BankConnectionRow): BankConnection => ({
  id: row.id,
  householdId: row.household_id,
  ledgerId: row.ledger_id,
  provider: row.provider,
  status: row.status,
  externalConnectionId: row.external_connection_id,
  lastSyncedAt: row.last_synced_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapAccount = (row: BankAccountRow): BankAccount => ({
  id: row.id,
  connectionId: row.connection_id,
  householdId: row.household_id,
  ledgerId: row.ledger_id,
  providerAccountId: row.provider_account_id,
  displayName: row.display_name,
  accountType: row.account_type,
  currency: row.currency,
  maskedAccountNumber: row.masked_account_number,
  isShared: row.is_shared,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTransaction = (row: BankTransactionRow): BankTransaction => ({
  id: row.id,
  bankAccountId: row.bank_account_id,
  householdId: row.household_id,
  ledgerId: row.ledger_id,
  providerTransactionId: row.provider_transaction_id,
  postedAt: row.posted_at,
  bookedAt: row.booked_at,
  amount: row.amount,
  currency: row.currency,
  direction: row.direction,
  description: row.description,
  counterparty: row.counterparty,
  rawPayload: row.raw_payload,
  transactionHash: row.transaction_hash,
  importedTransactionId: row.imported_transaction_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const getSupabase = async () => {
  const accessToken = await getAccessTokenFromCookies();
  return createServerSupabaseClient(accessToken);
};

export const findMembershipRole = async ({ householdId, userId }: { householdId: string; userId: string }): Promise<string | null> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("household_id", householdId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`メンバー権限の取得に失敗しました: ${error.message}`);
  }

  return (data as MembershipRoleRow | null)?.role ?? null;
};

export const createBankConnectionRow = async ({
  householdId,
  ledgerId,
  provider,
  createdBy,
}: {
  householdId: string;
  ledgerId: string | null;
  provider: BankProvider;
  createdBy: string;
}): Promise<BankConnection> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("bank_connections")
    .insert({
      household_id: householdId,
      ledger_id: ledgerId,
      provider,
      status: "connected",
      created_by: createdBy,
    })
    .select("id,household_id,ledger_id,provider,status,external_connection_id,last_synced_at,created_by,created_at,updated_at")
    .single();

  if (error) {
    throw new Error(`銀行接続の作成に失敗しました: ${error.message}`);
  }

  return mapConnection(data as BankConnectionRow);
};

export const listBankConnectionsByScope = async ({ householdId, ledgerId }: { householdId: string; ledgerId: string | null }): Promise<BankConnection[]> => {
  const supabase = await getSupabase();
  let query = supabase
    .from("bank_connections")
    .select("id,household_id,ledger_id,provider,status,external_connection_id,last_synced_at,created_by,created_at,updated_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (ledgerId) {
    query = query.or(`ledger_id.eq.${ledgerId},ledger_id.is.null`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`銀行接続一覧の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as BankConnectionRow[]).map(mapConnection);
};

export const getBankConnectionById = async (connectionId: string): Promise<BankConnection | null> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("bank_connections")
    .select("id,household_id,ledger_id,provider,status,external_connection_id,last_synced_at,created_by,created_at,updated_at")
    .eq("id", connectionId)
    .maybeSingle();

  if (error) {
    throw new Error(`銀行接続の取得に失敗しました: ${error.message}`);
  }

  return data ? mapConnection(data as BankConnectionRow) : null;
};

export const upsertBankAccounts = async ({
  connection,
  accounts,
}: {
  connection: BankConnection;
  accounts: Array<{
    provider_account_id: string;
    display_name: string;
    account_type: "checking" | "savings" | "credit" | "other";
    currency: string;
    masked_account_number: string | null;
    is_shared: boolean;
  }>;
}): Promise<BankAccount[]> => {
  if (accounts.length === 0) return [];

  const supabase = await getSupabase();
  const payloads = accounts.map((account) => ({
    ...account,
    connection_id: connection.id,
    household_id: connection.householdId,
    ledger_id: connection.ledgerId,
  }));

  const { data, error } = await supabase
    .from("bank_accounts")
    .upsert(payloads, { onConflict: "connection_id,provider_account_id" })
    .select("id,connection_id,household_id,ledger_id,provider_account_id,display_name,account_type,currency,masked_account_number,is_shared,created_at,updated_at");

  if (error) {
    throw new Error(`銀行口座の保存に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as BankAccountRow[]).map(mapAccount);
};

export const upsertBankTransactions = async ({
  bankAccountId,
  rows,
}: {
  bankAccountId: string;
  rows: Array<{
    household_id: string;
    ledger_id: string | null;
    provider_transaction_id: string | null;
    posted_at: string;
    booked_at: string | null;
    amount: number;
    currency: string;
    direction: "inflow" | "outflow";
    description: string;
    counterparty: string | null;
    raw_payload: Record<string, unknown>;
    transaction_hash: string;
  }>;
}): Promise<void> => {
  if (rows.length === 0) return;

  const supabase = await getSupabase();
  const payloads = rows.map((row) => ({ ...row, bank_account_id: bankAccountId }));
  const { error } = await supabase.from("bank_transactions").upsert(payloads, { onConflict: "bank_account_id,transaction_hash" });

  if (error) {
    throw new Error(`銀行明細の保存に失敗しました: ${error.message}`);
  }
};

export const updateConnectionSyncStatus = async ({
  connectionId,
  status,
}: {
  connectionId: string;
  status: "connected" | "error" | "disconnected" | "pending";
}) => {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("bank_connections")
    .update({ status, last_synced_at: new Date().toISOString() })
    .eq("id", connectionId);

  if (error) {
    throw new Error(`銀行接続の同期状態更新に失敗しました: ${error.message}`);
  }
};

export const listBankAccountsByScope = async ({ householdId, ledgerId }: { householdId: string; ledgerId: string | null }): Promise<BankAccount[]> => {
  const supabase = await getSupabase();
  let query = supabase
    .from("bank_accounts")
    .select("id,connection_id,household_id,ledger_id,provider_account_id,display_name,account_type,currency,masked_account_number,is_shared,created_at,updated_at")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (ledgerId) {
    query = query.or(`ledger_id.eq.${ledgerId},ledger_id.is.null`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`銀行口座一覧の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as BankAccountRow[]).map(mapAccount);
};

export const listBankTransactionsByScope = async ({
  householdId,
  ledgerId,
  accountId,
  onlyUnimported,
}: {
  householdId: string;
  ledgerId: string | null;
  accountId?: string;
  onlyUnimported?: boolean;
}): Promise<(BankTransaction & { accountDisplayName: string })[]> => {
  const supabase = await getSupabase();

  let query = supabase
    .from("bank_transactions")
    .select(
      "id,bank_account_id,household_id,ledger_id,provider_transaction_id,posted_at,booked_at,amount,currency,direction,description,counterparty,raw_payload,transaction_hash,imported_transaction_id,created_at,updated_at,account:bank_accounts!inner(display_name)",
    )
    .eq("household_id", householdId)
    .order("posted_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (ledgerId) {
    query = query.or(`ledger_id.eq.${ledgerId},ledger_id.is.null`);
  }

  if (accountId) {
    query = query.eq("bank_account_id", accountId);
  }

  if (onlyUnimported) {
    query = query.is("imported_transaction_id", null);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`銀行明細一覧の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as BankTransactionRow[]).map((row) => {
    const account = Array.isArray(row.account) ? row.account[0] : row.account;
    return {
      ...mapTransaction(row),
      accountDisplayName: account?.display_name ?? "不明口座",
    };
  });
};

export const markBankTransactionImported = async ({ bankTransactionId, transactionId }: { bankTransactionId: string; transactionId: string }) => {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("bank_transactions")
    .update({ imported_transaction_id: transactionId })
    .eq("id", bankTransactionId)
    .is("imported_transaction_id", null);

  if (error) {
    throw new Error(`銀行明細の取込状態更新に失敗しました: ${error.message}`);
  }
};
