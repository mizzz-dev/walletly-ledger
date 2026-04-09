import { createServerSupabaseClient, getAccessTokenFromCookies } from "@/lib/supabase/server";
import { NotificationChannel, NotificationType } from "@/types/domain";

export interface NotificationRow {
  id: string;
  user_id: string;
  household_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  channel: NotificationChannel | null;
  push_sent_at: string | null;
}

export interface NotificationInsertPayload {
  user_id: string;
  household_id: string;
  type: NotificationType;
  title: string;
  body: string;
  dedupe_key: string;
}

export const countUnreadNotifications = async ({ userId }: { userId: string }) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    throw new Error(`未読通知件数の取得に失敗しました: ${error.message}`);
  }

  return count ?? 0;
};

export const listNotificationsByUser = async ({
  userId,
  householdId,
}: {
  userId: string;
  householdId?: string;
}): Promise<NotificationRow[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);

  let query = supabase
    .from("notifications")
    .select("id,user_id,household_id,type,title,body,is_read,created_at,channel,push_sent_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (householdId) {
    query = query.eq("household_id", householdId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`通知一覧の取得に失敗しました: ${error.message}`);
  }

  return (data ?? []) as NotificationRow[];
};

export const createNotifications = async (payloads: NotificationInsertPayload[]) => {
  if (payloads.length === 0) {
    return;
  }

  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { error } = await supabase.from("notifications").upsert(payloads, {
    onConflict: "dedupe_key",
    ignoreDuplicates: true,
  });

  if (error) {
    throw new Error(`通知の作成に失敗しました: ${error.message}`);
  }
};

export const markNotificationAsRead = async ({ id, userId }: { id: string; userId: string }) => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    throw new Error(`通知の既読更新に失敗しました: ${error.message}`);
  }
};

export const listHouseholdUserIds = async ({ householdId }: { householdId: string }): Promise<string[]> => {
  const accessToken = await getAccessTokenFromCookies();
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase.from("memberships").select("user_id").eq("household_id", householdId);

  if (error) {
    throw new Error(`通知先ユーザーの取得に失敗しました: ${error.message}`);
  }

  return (data ?? []).map((row) => String(row.user_id));
};
