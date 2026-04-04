"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ledgers = [
  { id: "family-main", label: "家族家計", type: "family" },
  { id: "work-main", label: "仕事会計", type: "work" },
  { id: "trip-2026", label: "旅行グループ", type: "custom" },
] as const;

const menus = [
  { href: "/", label: "ホーム" },
  { href: "/transactions/new", label: "支出追加" },
  { href: "/dashboard", label: "集計" },
  { href: "/settlements", label: "清算" },
  { href: "/admin/presets", label: "プリセット管理" },
];

export const AppShell = () => {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-bold">walletly-shared</p>
          <p className="text-xs text-foreground/70">共有家計簿 / 会計PWA</p>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
          <Select aria-label="ledger切替" className="min-w-48">
            {ledgers.map((ledger) => (
              <option key={ledger.id} value={ledger.id}>{ledger.label} ({ledger.type})</option>
            ))}
          </Select>
          <nav className="flex flex-wrap gap-2">
            {menus.map((menu) => (
              <Link key={menu.href} href={menu.href} className={cn("rounded-xl px-3 py-2 text-sm", pathname === menu.href && "bg-muted font-semibold")}>{menu.label}</Link>
            ))}
          </nav>
          <Button variant="outline">ログイン</Button>
        </div>
      </div>
    </header>
  );
};
