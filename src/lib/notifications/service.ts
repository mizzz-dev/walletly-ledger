import { buildBudgetProgress, listBudgetItems } from "@/lib/budgets/service";
import { listDashboardTransactions } from "@/lib/dashboard/repository";
import {
  countUnreadNotifications,
  createNotifications,
  listHouseholdUserIds,
  listNotificationsByUser,
  markNotificationAsRead,
} from "@/lib/repositories/notification-repository";
import { listSettlementBaseRows } from "@/lib/repositories/settlement-repository";
import { aggregateMemberNetSummaries } from "@/lib/settlements/aggregation";
import { MemberSettlementSummary, NotificationItem } from "@/types/domain";
import { buildBudgetAlertMessage, detectBudgetAlertCandidates } from "@/lib/notifications/budget-alert";
import { buildSettlementReminderMessage, detectSettlementReminderCandidate } from "@/lib/notifications/settlement-alert";

const toYearMonth = (dateText: string) => {
  if (!dateText) return null;
  const yearMonth = dateText.slice(0, 7);
  return /^\d{4}-\d{2}$/.test(yearMonth) ? yearMonth : null;
};

const mapNotification = (row: {
  id: string;
  user_id: string;
  household_id: string;
  type: "budget_exceeded" | "settlement_pending";
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  channel: "push" | "email" | null;
  push_sent_at: string | null;
}): NotificationItem => ({
  id: row.id,
  userId: row.user_id,
  householdId: row.household_id,
  type: row.type,
  title: row.title,
  body: row.body,
  isRead: row.is_read,
  createdAt: row.created_at,
  channel: row.channel,
  pushSentAt: row.push_sent_at,
});

export const getUnreadNotificationCount = async ({ userId }: { userId: string }) => {
  return countUnreadNotifications({ userId });
};

export const listNotifications = async ({ userId, householdId }: { userId: string; householdId?: string }) => {
  const rows = await listNotificationsByUser({ userId, householdId });
  return rows.map((row) => mapNotification(row));
};

export const readNotification = async ({ id, userId }: { id: string; userId: string }) => {
  return markNotificationAsRead({ id, userId });
};

export const generateBudgetNotificationsOnTransactionSaved = async ({
  householdId,
  ledgerId,
  transactionDate,
}: {
  householdId: string;
  ledgerId: string;
  transactionDate: string;
}) => {
  const period = toYearMonth(transactionDate);
  if (!period) {
    return;
  }

  const [budgets, txRows, userIds] = await Promise.all([
    listBudgetItems({ householdId, ledgerId, period }),
    listDashboardTransactions({ householdId, ledgerId }),
    listHouseholdUserIds({ householdId }),
  ]);

  if (budgets.length === 0 || userIds.length === 0) {
    return;
  }

  const transactions = txRows.map((row) => ({
    id: row.id,
    date: row.transaction_date,
    amount: Number(row.amount),
    categoryId: row.category_id,
    categoryName: null,
    categoryColor: null,
  }));

  const progress = buildBudgetProgress({ budgets, transactions, period });
  const alerts = detectBudgetAlertCandidates(progress.items);
  if (alerts.length === 0) {
    return;
  }

  const payloads = userIds.flatMap((userId) =>
    alerts.map((alert) => {
      const message = buildBudgetAlertMessage(alert);
      return {
        user_id: userId,
        household_id: householdId,
        type: "budget_exceeded" as const,
        title: message.title,
        body: message.body,
        dedupe_key: `budget:${period}:${alert.level}:${alert.budgetId}:${userId}`,
      };
    }),
  );

  await createNotifications(payloads);
};

export const generateSettlementReminderNotifications = async ({
  householdId,
  ledgerId,
  memberIds,
  now,
}: {
  householdId: string;
  ledgerId: string;
  memberIds: string[];
  now?: Date;
}) => {
  const rows = await listSettlementBaseRows({ householdId, ledgerId });

  const summaries: MemberSettlementSummary[] = aggregateMemberNetSummaries({
    memberIds,
    transactions: rows.transactions.map((row) => ({
      payerMembershipId: row.payer_membership_id,
      amount: Number(row.amount),
      splits: (row.splits ?? []).map((split) => ({
        memberId: split.member_id,
        shareAmount: Number(split.share_amount),
      })),
    })),
    settlements: rows.settlements.map((settlement) => ({
      fromMemberId: settlement.from_membership_id,
      toMemberId: settlement.to_membership_id,
      amount: Number(settlement.amount),
    })),
  });

  const lastSettlementAt = rows.lastSettlementAt;
  const candidate = detectSettlementReminderCandidate({
    summaries,
    lastSettlementAt,
    now: now ?? new Date(),
  });

  if (!candidate) {
    return;
  }

  const userIds = await listHouseholdUserIds({ householdId });
  if (userIds.length === 0) {
    return;
  }

  const message = buildSettlementReminderMessage(candidate);
  await createNotifications(
    userIds.map((userId) => ({
      user_id: userId,
      household_id: householdId,
      type: "settlement_pending" as const,
      title: message.title,
      body: message.body,
      dedupe_key: `settlement:${householdId}:${ledgerId}:${candidate.remindAfterDays}:${userId}`,
    })),
  );
};
