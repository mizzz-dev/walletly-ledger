import { Card } from "@/components/ui/card";
import { resolveAppContext } from "@/lib/context/app-context";
import { listNotifications } from "@/lib/notifications/service";
import { markNotificationReadAction } from "./actions";

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ householdId?: string; ledgerId?: string }>;
}) {
  const params = await searchParams;
  const context = await resolveAppContext({ householdId: params.householdId, ledgerId: params.ledgerId });

  if (!context.userId || !context.currentHouseholdId) {
    return <p className="text-sm text-foreground/70">利用可能な世帯または通知対象ユーザーがありません。</p>;
  }

  try {
    const notifications = await listNotifications({
      userId: context.userId,
      householdId: context.currentHouseholdId,
    });

    return (
      <Card className="space-y-4">
        <h1 className="text-xl font-bold">通知一覧</h1>
        {notifications.length === 0 ? (
          <p className="text-sm text-foreground/70">現在、通知はありません。</p>
        ) : (
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <li key={notification.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{notification.title}</p>
                    <p className="mt-1 text-sm text-foreground/70">{notification.body}</p>
                    <p className="mt-2 text-xs text-foreground/60">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {notification.isRead ? (
                      <span className="rounded-full bg-muted px-2 py-1 text-xs">既読</span>
                    ) : (
                      <>
                        <span className="rounded-full bg-rose-500 px-2 py-1 text-xs text-white">未読</span>
                        <form action={markNotificationReadAction}>
                          <input type="hidden" name="notificationId" value={notification.id} />
                          <button type="submit" className="rounded-lg border border-border px-2 py-1 text-xs hover:bg-muted">
                            既読にする
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "通知一覧の取得に失敗しました";
    return (
      <Card>
        <h1 className="text-xl font-bold">通知一覧</h1>
        <p className="mt-3 text-sm text-rose-600">{message}</p>
      </Card>
    );
  }
}
