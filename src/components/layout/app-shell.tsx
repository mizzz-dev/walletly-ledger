import { resolveAppContext } from "@/lib/context/app-context";
import { AppShellClient } from "@/components/layout/app-shell-client";
import { getUnreadNotificationCount } from "@/lib/notifications/service";

export const AppShell = async () => {
  const context = await resolveAppContext().catch(() => null);
  const unreadNotificationCount = context?.userId
    ? await getUnreadNotificationCount({ userId: context.userId }).catch(() => 0)
    : 0;

  return (
    <AppShellClient
      households={context?.households ?? []}
      ledgers={context?.ledgers ?? []}
      fallbackActiveUser={context?.isFallbackUser ?? false}
      unreadNotificationCount={unreadNotificationCount}
    />
  );
};
