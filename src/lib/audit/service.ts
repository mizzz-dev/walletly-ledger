import { buildAuditDiffPayload, sanitizeAuditJson } from "@/lib/audit/payload";
import { insertAuditLog, listAuditLogs } from "@/lib/audit/repositories/audit-repository";

export const writeAuditLog = async ({
  householdId,
  ledgerId,
  actorUserId,
  entityType,
  entityId,
  action,
  beforeJson,
  afterJson,
  metadataJson,
}: {
  householdId: string;
  ledgerId: string | null;
  actorUserId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  metadataJson?: unknown;
}) => {
  if (!actorUserId) {
    throw new Error("監査ログの実行者が不正です");
  }

  const diffPayload = buildAuditDiffPayload({ before: beforeJson, after: afterJson });

  await insertAuditLog({
    household_id: householdId,
    ledger_id: ledgerId,
    actor_user_id: actorUserId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    before_json: diffPayload.beforeJson,
    after_json: diffPayload.afterJson,
    metadata_json: sanitizeAuditJson(metadataJson),
  });
};

export const listLedgerAuditLogs = async ({
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
  return listAuditLogs({ householdId, ledgerId, entityType, action, from, to });
};
