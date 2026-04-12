import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { AccountingPeriodClosure } from "@/types/domain";

interface ClosureRow {
  id: string;
  household_id: string;
  ledger_id: string;
  period_start: string;
  period_end: string;
  status: "open" | "closed";
  closed_at: string | null;
  closed_by: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

const toDomain = (row: ClosureRow): AccountingPeriodClosure => ({
  id: row.id,
  householdId: row.household_id,
  ledgerId: row.ledger_id,
  periodStart: row.period_start,
  periodEnd: row.period_end,
  status: row.status,
  closedAt: row.closed_at,
  closedBy: row.closed_by,
  note: row.note,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const listClosuresByLedger = async ({ householdId, ledgerId }: { householdId: string; ledgerId: string }) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("ledger_closures")
    .select("id,household_id,ledger_id,period_start,period_end,status,closed_at,closed_by,note,created_at,updated_at")
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .order("period_start", { ascending: false })
    .limit(24);

  if (error) {
    throw new Error(`月次締め一覧の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as ClosureRow[]).map(toDomain);
};

export const listClosedClosuresByLedger = async ({ householdId, ledgerId }: { householdId: string; ledgerId: string }) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("ledger_closures")
    .select("id,household_id,ledger_id,period_start,period_end,status,closed_at,closed_by,note,created_at,updated_at")
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .eq("status", "closed")
    .order("period_start", { ascending: false });

  if (error) {
    throw new Error(`締め済み期間の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as ClosureRow[]).map(toDomain);
};

export const upsertPeriodClosure = async ({
  householdId,
  ledgerId,
  periodStart,
  periodEnd,
  actorUserId,
  note,
}: {
  householdId: string;
  ledgerId: string;
  periodStart: string;
  periodEnd: string;
  actorUserId: string;
  note?: string;
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { data, error } = await supabase
    .from("ledger_closures")
    .upsert(
      {
        household_id: householdId,
        ledger_id: ledgerId,
        period_start: periodStart,
        period_end: periodEnd,
        status: "closed",
        closed_at: new Date().toISOString(),
        closed_by: actorUserId,
        note: note?.trim() ? note.trim() : null,
      },
      {
        onConflict: "ledger_id,period_start,period_end",
      },
    )
    .select("id,household_id,ledger_id,period_start,period_end,status,closed_at,closed_by,note,created_at,updated_at")
    .single();

  if (error) {
    throw new Error(`月次締めの保存に失敗しました: ${error.message}`);
  }

  return toDomain(data as ClosureRow);
};
