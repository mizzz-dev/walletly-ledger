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
- 支出追加画面（カテゴリ別プリセット自動適用 + 手動調整 + プレビュー）
- 分割プリセット管理画面 `/admin/presets`（一覧・検索・フィルタ・並び替え・新規/編集/複製/アーカイブ）
- 分割方式フォーム（equal / ratio / weight / mixed_fixed の動的入力 + バリデーション）
- 清算提案ロジック（greedy）と表示
- 集計ダッシュボード（ダミーデータ + グラフ）
- Supabase初期スキーマ + RLS方針ファイル
- 単体テスト（分割ロジック / 清算ロジック / プリセット選択 / プレビュー）

## 分割プリセット管理画面
- ページ: `/admin/presets`
- DataTableライクUIで以下に対応
  - 検索（名前・カテゴリ）
  - 状態フィルタ（draft/published/archived）
  - 並び替え（優先度/更新日/名前）
  - 優先度の直接編集
  - 新規作成・編集（Sheet風オーバーレイ）
  - 複製・アーカイブ
  - 条件指定（最低金額・キーワード・曜日・店舗名）
  - 端数処理（四捨五入/切り上げ/切り捨て）
  - 編集中プレビュー

## 支出作成画面での自動適用フロー
1. カテゴリ・金額・メモ・店舗名・日付を入力
2. `published` のプリセットを優先度順で探索
3. 最初に条件一致したプリセットを自動適用
4. 金額変更時はリアルタイム再計算
5. 適用中のプリセット名を表示
6. プレビュー金額はメンバー単位で手動修正可能

## Supabase 接続を見据えた整理（今回時点）
- `category_split_presets` を想定した `CategorySplitPreset` 型を追加
- `PresetRepository` インターフェースを追加し、モック実装を分離
- 将来的に Server Component / Route Handler 経由で `/api/presets` に差し替えやすい構造

## 現時点で未実装
- プリセット・支出データの永続化（現在はモック）
- `/api/presets` の Route Handler 実装
- Supabase Auth連携とRLSの本番運用
- 監査ログ・変更履歴

## 今後の拡張余地
- Supabase接続本実装（CRUD / キャッシュ / 楽観更新）
- 銀行連携（明細取り込みとカテゴリ自動推定）
- OCR連携（レシートから店舗名・金額・日付を抽出）

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
- `src/components/` : UIと画面コンポーネント
- `src/lib/` : Supabase, 分割, 清算, プリセット選択/プレビュー
- `supabase/migrations/` : DBスキーマ
- `supabase/policies/` : RLSポリシー
- `tests/` : Vitestユニットテスト

## PWA
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/icon.svg` / `public/icons/icon-maskable.svg`
- `src/components/layout/pwa-register.tsx`
