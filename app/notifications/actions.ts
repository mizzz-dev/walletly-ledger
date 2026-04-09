"use server";

import { revalidatePath } from "next/cache";
import { resolveCurrentUser } from "@/lib/auth/current-user";
import { readNotification } from "@/lib/notifications/service";

export const markNotificationReadAction = async (formData: FormData) => {
  const currentUser = await resolveCurrentUser();
  if (!currentUser.userId) {
    throw new Error("通知の既読更新にはログインが必要です");
  }

  const notificationId = String(formData.get("notificationId") ?? "");
  if (!notificationId) {
    throw new Error("通知IDが指定されていません");
  }

  await readNotification({ id: notificationId, userId: currentUser.userId });
  revalidatePath("/notifications");
};
