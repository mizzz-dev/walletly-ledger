import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <Card>
        <h1 className="text-2xl font-bold">MVPスターター</h1>
        <p className="mt-2 text-sm text-foreground/80">Ledger単位で家族・仕事・旅行などの収支を切り替えて管理できます。</p>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold">次にやること</h2>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-foreground/80">
          <li>Supabaseの環境変数を設定</li>
          <li>マイグレーション適用</li>
          <li>支出登録とプリセット管理の接続</li>
        </ul>
      </Card>
    </section>
  );
}
