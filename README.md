# walletly-shared (MVPスターター)

同棲・家族・仕事・旅行などの用途を1アプリで扱う、共有家計簿 / 会計PWAの初期実装です。

## 技術スタック
- Next.js App Router / TypeScript
- Tailwind CSS（shadcn/ui風の軽量コンポーネント）
- Supabase (Auth / Postgres / Storage / RLS)
- PWA (manifest + service worker + SVGアイコン雛形)
- Vitest

## 実装済み (MVP土台)
- 共通レイアウト・レスポンシブナビ・Ledger切替UI
- 支出追加画面（分割方式: 等分/比率/重み/固定額混合）
- 分割プリセット管理画面 `/admin/presets`（一覧・検索・状態表示・操作UI）
- 清算提案ロジック（greedy）と表示
- 集計ダッシュボード（ダミーデータ + グラフ）
- Supabase初期スキーマ + RLS方針ファイル
- 単体テスト（分割ロジック / 清算ロジック / 失敗ケース）

## これから接続する部分
- Supabase Authログイン・サインアップの実装
- `/admin/presets` の Drawer/Sheet 編集UIとCRUD API接続
- 実データ集計への差し替え
- OCR・銀行連携・税務エクスポートの本実装

## セットアップ
```bash
cp .env.example .env.local
# 値を設定後
npm install
npm run dev
```

### テスト
```bash
npm run test
```

## 主要ディレクトリ
- `app/` : App Routerページ
- `src/lib/` : Supabase, 分割, 清算, 端数処理ロジック
- `supabase/migrations/` : DBスキーマ
- `supabase/policies/` : RLSポリシー
- `tests/` : Vitestユニットテスト

## PWA
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/icon.svg` / `public/icons/icon-maskable.svg`
- `src/components/layout/pwa-register.tsx`

## 拡張設計メモ
- 仕事用会計拡張に向けて `journals`, `journal_lines` を雛形作成
- 銀行連携に向けて `bank_connections`, `bank_accounts`, `bank_transactions` を準備
- OCR添付を見据えて `transactions.receipt_path` を保持
