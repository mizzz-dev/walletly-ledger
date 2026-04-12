import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { AuditLog } from "@/types/domain";

interface AuditLogRow {
  id: string;
  household_id: string;
  ledger_id: string | null;
  actor_user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  users: { display_name: string | null } | null;
}

export interface AuditLogListItem extends AuditLog {
  actorName: string | null;
}

const toDomain = (row: AuditLogRow): AuditLogListItem => ({
  id: row.id,
  householdId: row.household_id,
  ledgerId: row.ledger_id,
  actorUserId: row.actor_user_id,
  entityType: row.entity_type,
  entityId: row.entity_id,
  action: row.action,
  beforeJson: row.before_json,
  afterJson: row.after_json,
  metadataJson: row.metadata_json,
  createdAt: row.created_at,
  actorName: row.users?.display_name ?? null,
});

export const insertAuditLog = async (payload: {
  household_id: string;
  ledger_id: string | null;
  actor_user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: Record<string, unknown> | null;
  after_json: Record<string, unknown> | null;
  metadata_json: Record<string, unknown> | null;
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  const { error } = await supabase.from("audit_logs").insert(payload);
  if (error) {
    throw new Error(`監査ログ保存に失敗しました: ${error.message}`);
  }
};

export const listAuditLogs = async ({
  householdId,
  ledgerId,
  entityType,
  action,
  from,
  to,
}: {
  householdId: string;
  ledgerId: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
}) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  let query = supabase
    .from("audit_logs")
    .select("id,household_id,ledger_id,actor_user_id,entity_type,entity_id,action,before_json,after_json,metadata_json,created_at,users!audit_logs_actor_user_id_fkey(display_name)")
    .eq("household_id", householdId)
    .eq("ledger_id", ledgerId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (entityType) {
    query = query.eq("entity_type", entityType);
  }

  if (action) {
    query = query.eq("action", action);
  }

  if (from) {
    query = query.gte("created_at", `${from}T00:00:00.000Z`);
  }

  if (to) {
    query = query.lte("created_at", `${to}T23:59:59.999Z`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`監査ログ一覧の取得に失敗しました: ${error.message}`);
  }

  return ((data ?? []) as AuditLogRow[]).map(toDomain);
};
