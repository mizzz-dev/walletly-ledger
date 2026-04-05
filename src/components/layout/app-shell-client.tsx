"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { HouseholdOption, LedgerOption } from "@/types/domain";

const menus = [
  { href: "/", label: "ホーム" },
  { href: "/transactions/new", label: "支出追加" },
  { href: "/transactions", label: "取引一覧" },
  { href: "/dashboard", label: "集計" },
  { href: "/settlements", label: "清算" },
  { href: "/admin/presets", label: "プリセット管理" },
];

interface Props {
  households: HouseholdOption[];
  ledgers: LedgerOption[];
  fallbackActiveUser: boolean;
}

export const AppShellClient = ({ households, ledgers, fallbackActiveUser }: Props) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedHouseholdId = searchParams.get("householdId") ?? households[0]?.id;
  const visibleLedgers = ledgers.filter((ledger) => ledger.householdId === selectedHouseholdId);
  const selectedLedgerId = searchParams.get("ledgerId") ?? visibleLedgers[0]?.id;

  const updateSearchParams = (nextHouseholdId?: string, nextLedgerId?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextHouseholdId) params.set("householdId", nextHouseholdId);
    if (nextLedgerId) params.set("ledgerId", nextLedgerId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold">walletly-shared</p>
          <p className="text-xs text-foreground/70">共有家計簿 / 会計PWA</p>
          {fallbackActiveUser ? <p className="text-xs text-amber-600">開発フォールバックユーザーで動作中</p> : null}
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Select
            aria-label="世帯切替"
            className="min-w-48"
            value={selectedHouseholdId}
            onChange={(e) => {
              const householdId = e.target.value;
              const firstLedgerId = ledgers.find((ledger) => ledger.householdId === householdId)?.id;
              updateSearchParams(householdId, firstLedgerId);
            }}
          >
            {households.map((household) => (
              <option key={household.id} value={household.id}>{household.name}</option>
            ))}
          </Select>
          <Select aria-label="台帳切替" className="min-w-48" value={selectedLedgerId} onChange={(e) => updateSearchParams(selectedHouseholdId, e.target.value)}>
            {visibleLedgers.map((ledger) => (
              <option key={ledger.id} value={ledger.id}>{ledger.name} ({ledger.type})</option>
            ))}
          </Select>
          <nav className="flex flex-wrap gap-2">
            {menus.map((menu) => (
              <Link key={menu.href} href={menu.href} className={cn("rounded-xl px-3 py-2 text-sm", pathname === menu.href && "bg-muted font-semibold")}>{menu.label}</Link>
            ))}
          </nav>
          <Button variant="outline">認証連携準備中</Button>
        </div>
      </div>
    </header>
  );
};
