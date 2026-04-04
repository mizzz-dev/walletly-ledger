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
- 単体テスト（分割ロジック / 清算ロジック / プリセット選択 / プレビュー / Repository整形）

## 分割プリセットのSupabase永続化（今回）
- `category_split_presets` を Supabase に永続化し、管理画面と支出作成画面を実データ接続
- 管理画面 `/admin/presets`
  - 一覧表示（Supabase）
  - 新規作成 / 更新 / 複製 / アーカイブ
  - 状態変更（draft/published/archived）
  - 優先度更新
- 支出作成画面 `/transactions/new`
  - Supabase から `published` のみ取得
  - 優先度順で最初に一致したプリセットを自動適用

## RLS / ロール制御（最小実装）
- household メンバーのみプリセット参照可能
- owner / editor / member が更新可能（viewerは閲覧のみ想定）
- archived / draft は自動適用対象外（UI一覧には表示可）

## データアクセス構成
- `src/lib/preset-repository.ts` : Repository interface + driver切替
- `src/lib/preset-repository/supabase.ts` : Supabase 実装
- `src/lib/preset-repository/mock.ts` : モック実装（`NEXT_PUBLIC_USE_MOCK_PRESET=true` で利用）
- `src/lib/preset-service.ts` : 画面から呼ぶユースケース層
- `app/admin/presets/actions.ts` : 管理画面更新系の Server Action

## 現時点の制約
- 世帯ID/ユーザーIDは環境変数（`NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID` / `NEXT_PUBLIC_DEFAULT_USER_ID`）を暫定利用
- Authセッション連携・細粒度のLedger単位権限制御は未実装
- 監査ログは未実装

## 今後の拡張候補
- 監査ログ
- JSON インポート / エクスポート
- API / Edge Functions 経由への統一
- Ledger 単位の細かい権限制御

## セットアップ
```bash
cp .env.example .env.local
# 値を設定後
npm install
npm run dev
```

### 必須環境変数
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID=
NEXT_PUBLIC_DEFAULT_USER_ID=
# true の場合はプリセットのみモック実装
NEXT_PUBLIC_USE_MOCK_PRESET=false
```

### 動作確認
1. Supabase migration / policy を適用
2. `/admin/presets` で作成・更新・複製・アーカイブ・状態変更・優先度変更を実行
3. `/transactions/new` でカテゴリ・金額を入力し、`published` プリセットが適用されることを確認

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
