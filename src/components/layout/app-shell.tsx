import { resolveAppContext } from "@/lib/context/app-context";
import { AppShellClient } from "@/components/layout/app-shell-client";

export const AppShell = async () => {
  const context = await resolveAppContext().catch(() => null);

  return (
    <AppShellClient
      households={context?.households ?? []}
      ledgers={context?.ledgers ?? []}
      fallbackActiveUser={context?.isFallbackUser ?? false}
    />
  );
};
