# walletly-shared (MVPスターター)

同棲・家族・仕事・旅行などの用途を1アプリで扱う、共有家計簿 / 会計PWAの初期実装です。

## 技術スタック
- Next.js App Router / TypeScript
- Tailwind CSS（shadcn/ui風の軽量コンポーネント）
- Supabase (Auth / Postgres / Storage / RLS)
- PWA (manifest + service worker + SVGアイコン雛形)
- Vitest

## 実装済み (MVP土台)
- 共通レイアウト・レスポンシブナビ
- 支出追加画面（カテゴリ別プリセット自動適用 + 手動調整 + プレビュー）
- 分割プリセット管理画面 `/admin/presets`
- 分割方式フォーム（equal / ratio / weight / mixed_fixed の動的入力 + バリデーション）
- 清算提案ロジック（greedy）と表示
- 集計ダッシュボード（ダミーデータ + グラフ）
- Supabase初期スキーマ + RLS方針ファイル
- 単体テスト（分割ロジック / 清算ロジック / プリセット選択 / プレビュー / Repository整形）

## 今回の変更（Auth・世帯/台帳連携の土台）
- Supabase Auth セッション（cookie）から現在ユーザーを解決するサーバー向け処理を追加
- 現在ユーザーの所属 `households` / `memberships` / `ledgers` を取得し、ヘッダーの世帯/台帳セレクターに接続
- `/transactions/new` のカテゴリ候補・メンバー候補を固定配列から Supabase 実データへ置き換え
- `/admin/presets` のカテゴリ候補・メンバー候補を Supabase 実データへ置き換え
- プリセット一覧取得を、現在選択中の `householdId` / `ledgerId` に連動

## データアクセス構成
- `src/lib/auth/*` : 現在ユーザー解決
- `src/lib/context/*` : 世帯/台帳選択の解決
- `src/lib/households/*` : 世帯取得
- `src/lib/ledgers/*` : 台帳取得
- `src/lib/categories/*` : カテゴリ取得・整形
- `src/lib/memberships/*` : メンバー取得・整形
- `src/lib/preset-service.ts` : 画面から呼ぶプリセット用途層

## Auth セッション前提とフォールバック
- 原則は Supabase Auth のセッション cookie から `auth.getUser` でユーザーを解決します
- 開発時のみ `NEXT_PUBLIC_DEFAULT_USER_ID` をフォールバックとして使用できます
- `NEXT_PUBLIC_DEFAULT_HOUSEHOLD_ID` は今回の実装で不要になりました

## Household / Ledger 選択の使い方
- ヘッダーのセレクターから世帯と台帳を選択します
- 選択値は URL クエリ (`householdId`, `ledgerId`) として各画面に反映されます
- `/admin/presets` と `/transactions/new` は同じ選択状態に追従します

## 現時点の制約
- ログイン画面本体は未実装（セッション前提の接続のみ実装）
- ヘッダー表示時の選択候補は、現在ユーザー所属データが前提
- 取引保存本体（transactions insert）のRLS/権限フローは次PRで強化予定

## 次PR候補
- 本格的なログイン/ログアウト導線
- 世帯/台帳選択の永続化（cookie）
- transaction 作成系の Server Action と RLS 強化
- profiles/users の表示名統合

## セットアップ
```bash
cp .env.example .env.local
npm install
npm run dev
```

### 必須環境変数
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# セッションがない開発環境向け任意
NEXT_PUBLIC_DEFAULT_USER_ID=
# true の場合はプリセットのみモック実装
NEXT_PUBLIC_USE_MOCK_PRESET=false
```

### 動作確認
1. Supabase migration / policy を適用
2. Auth でログイン済みセッションを用意（または `NEXT_PUBLIC_DEFAULT_USER_ID` を設定）
3. `/admin/presets` でカテゴリ・メンバー候補が実データ表示されることを確認
4. `/transactions/new` でカテゴリ・支払者・分割プレビューが実データで動作することを確認

### テスト
```bash
npm run test
```

## 主要ディレクトリ
- `app/` : App Routerページ
- `src/components/` : UIと画面コンポーネント
- `src/lib/` : Supabase, Auth, households/ledgers/categories/memberships, 分割, 清算, プリセット
- `supabase/migrations/` : DBスキーマ
- `supabase/policies/` : RLSポリシー
- `tests/` : Vitestユニットテスト
