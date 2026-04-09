# walletly-shared (MVPスターター)

同棲・家族・仕事・旅行などの用途を1アプリで扱う、共有家計簿 / 会計PWAの初期実装です。

## 技術スタック
- Next.js App Router / TypeScript
- Tailwind CSS（shadcn/ui風の軽量コンポーネント）
- Supabase (Auth / Postgres / Storage / RLS)
- PWA (manifest + service worker + SVGアイコン雛形)
- Vitest

## 実装済み (今回のPR時点)
- 世帯 / 台帳の解決（Supabase Authセッション起点）
- カテゴリ・メンバー候補の実データ化
- `/transactions/new` から支出 + 分担（splits）の保存
- `/transactions` で取引一覧表示（日付 / カテゴリ / 金額 / 支払者 / メモ / 適用プリセット）
- `/settlements` で未精算サマリ・精算提案を実データで算出
- `/settlements` で精算記録の保存（現金 / 振込 / PayPay / その他）
- `/dashboard` で月次サマリ・カテゴリ別支出割合・日別支出推移を実データ表示
- `/budgets` でカテゴリ別 / 全体の月次予算を作成・編集・削除
- `/dashboard` で予算 vs 実績、カテゴリ別進捗バー、超過可視化を表示
- `/notifications` で予算超過通知・精算リマインド通知を一覧表示し既読化
- 支出保存時の予算しきい値判定（80%到達 / 100%超過）による通知生成
- `/settlements` 表示時の未精算状態チェックによるリマインド通知生成
- PWA Service Worker の Push受信ハンドラ（通知表示 / 通知クリック遷移）
- レシート / 領収書画像のアップロード + Supabase Storage保存基盤（receipt_attachments）
- OCR（モックprovider）による支出下書き生成と `/transactions/new` への自動入力
- 分割ロジック / 清算ロジック / payload整形 / 集計ロジックの単体テスト

## データアクセス構成
- `src/lib/repositories/*` : Supabaseとの入出力
- `src/lib/transactions/*` : 取引保存payload整形・検証
- `src/lib/transaction-service.ts` : 支出保存と取引一覧用途
- `src/lib/settlements/*` : 清算集計・提案生成
- `src/lib/settlements/service.ts` : 清算画面向けサービス
- `src/lib/dashboard/repository.ts` : ダッシュボード向け取引取得
- `src/lib/dashboard/aggregation.ts` : ダッシュボード集計の純粋関数
- `src/lib/dashboard/service.ts` : ダッシュボード画面向けサービス
- `src/lib/budgets/repository.ts` : 予算CRUDのSupabaseアクセス
- `src/lib/budgets/aggregation.ts` : 予算進捗（予算/実績/残額/進捗率）集計
- `src/lib/budgets/service.ts` : 予算画面・ダッシュボード連携向けサービス
- `src/lib/notifications/*` : 通知判定ロジック（予算・精算）
- `src/lib/repositories/notification-repository.ts` : 通知テーブルのSupabaseアクセス
- `src/lib/repositories/receipt-repository.ts` : レシート添付テーブル + Storageアクセス
- `src/lib/ocr/*` : OCR provider抽象化 / 正規化 / draft変換

## 画面ごとの使い方
### 支出登録 `/transactions/new`
1. 金額・カテゴリ・支払者・日付を入力
2. 必要に応じて分担プレビューを手動調整
3. 「支出を保存」で `transactions` と `splits` を連続保存

### レシートOCR取り込み（`/transactions/new` 内）
1. 「レシートを選択 / 撮影」で `image/*` をアップロード（モバイルは `capture` 対応）
2. 画像を Supabase Storage バケット `receipt-attachments` に保存
3. OCR provider（現時点は `MockOcrProvider`）で `rawText` を取得
4. `ReceiptDraft`（金額・日付・店舗名・メモ候補）をフォーム初期値に反映
5. ユーザーが修正後に通常の支出保存を行い、`receipt_attachments.transaction_id` と紐づけ

> 注意: OCRは現時点でモック実装です。認識精度ではなく、呼び出し口・型・UI連携の基盤を優先しています。

### 取引一覧 `/transactions`
- 現在選択中の世帯 / 台帳に紐づく取引を新しい順で表示
- 適用プリセットがある場合は名称を表示

### 精算 `/settlements`
- 取引 + 分担から各メンバーの `paid / owed / net` を計算
- 既存 `settlements` 記録を相殺して未精算残高を再計算
- 提案行ごとに精算記録を保存すると、即時再計算される

### ダッシュボード `/dashboard`
- 現在選択中の世帯 / 台帳に紐づく `transactions` を集計して表示
- 指標:
  - 今月の総支出
  - 取引件数
  - 前月比（前月総支出との差分）
  - カテゴリ別支出割合（円グラフ）
  - 日別の支出推移（棒グラフ）
- 今月データがない場合はデータなし状態を表示
- 予算が設定されている場合は `予算 vs 実績` として進捗を表示し、超過カテゴリは赤色で表示

### 予算管理 `/budgets`
- 現在選択中の世帯 / 台帳に対して月次予算を管理
- カテゴリ単位予算、またはカテゴリなしの全体予算を設定可能
- 表示項目:
  - 予算
  - 使用額
  - 残額
  - 進捗%
- owner/editor は作成・編集・削除可能、viewer は閲覧のみ

### 通知 `/notifications`
- 現在選択中の世帯に紐づく通知（予算超過 / 精算リマインド）を表示
- 未読・既読ステータスを表示し、未読は一覧から既読化可能
- ヘッダーのベルアイコンで未読件数を確認可能

## Supabaseスキーマ / RLS
- migration:
  - `202604040001_init.sql`
  - `202604040002_category_split_presets_persistence.sql`
- `202604050001_transactions_settlements_core.sql`（今回追加）
- `202604090001_budgets_monthly_management.sql`（今回追加）
- `202604090002_notifications_foundation.sql`（今回追加）
- `202604090003_receipt_ocr_foundation.sql`（今回追加）
- policy:
  - `supabase/policies/rls.sql`

RLS方針（今回）:
- householdメンバー: `transactions / splits / settlements` 参照可
- owner/editor: 作成可
- viewer（owner/editor以外）: 閲覧のみ
- `created_by` / `payer_membership_id` / 精算対象membershipの整合を policy 側でチェック
- `budgets` は householdメンバー参照可、owner/editorのみ作成・更新・削除可
- `notifications` は本人のみ参照・既読化可能、owner/editorが生成可能
- `receipt_attachments` は世帯メンバー参照可、owner/editorのみ作成・更新・削除可

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
NEXT_PUBLIC_SUPABASE_RECEIPT_BUCKET=receipt-attachments
# セッションがない開発環境向け任意
NEXT_PUBLIC_DEFAULT_USER_ID=
# true の場合はプリセットのみモック実装
NEXT_PUBLIC_USE_MOCK_PRESET=false
```

## 動作確認手順
1. Supabase migration / policy を適用
2. Authでログイン済みセッション（または `NEXT_PUBLIC_DEFAULT_USER_ID`）を用意
3. `/transactions/new` で支出登録し、保存成功メッセージを確認
4. `/transactions` で登録済み取引が表示されることを確認
5. `/settlements` で提案生成を確認し、提案行を1件記録
6. `/settlements` が再計算され、未精算額が減ることを確認
7. `/dashboard` を開き、同じ世帯 / 台帳の支出が集計表示されることを確認

## 現時点の制約
- 取引一覧の詳細フィルタ（カテゴリ/支払者/期間）は未実装
- 取引更新・削除、精算記録の取消は未実装
- `transactions` + `splits` はアプリ側で連続保存（DBトランザクション関数化は未実装）
- OCR providerはモック実装（`MockOcrProvider`）で、実画像認識の精度保証は未対応
- 行明細抽出・税額抽出・インボイス番号抽出は未実装（rawText保持まで）
- 銀行明細連携 / 仕訳出力は未着手
- 予算期間は現時点で月次（`YYYY-MM`）固定
- 通知生成トリガーは現時点で画面操作起点（支出保存時 / 精算画面表示時）
- Pushは受信ハンドラのみ実装（配信は未実装）
- 収入カテゴリ・期間フィルタ切替（週/月/年）は未実装

## 次PR候補
- 取引一覧フィルタ・ページング
- 取引編集/削除と監査ログ
- 精算記録の取消・差額入力フロー
- DB function化による厳密な原子保存
- 予算進捗の通知（80%到達 / 超過）をSupabase Edge Functionsで配信
- cron / Edge Functions による定期通知生成の自動化
- Push送信API（Web Push）と push_sent_at 更新
- 通知チャネル拡張（メール / LINE）と配信設定管理
- 予算テンプレート（カテゴリ一括初期化）と繰り越し設定
- 高精度OCR provider（Cloud Vision / Textract / Azure OCR 等）の差し替え
- 行明細抽出・税額抽出・適格請求書番号抽出（税務用途）
- 領収書台帳画面（検索・再OCR・添付再紐づけ）
- 収入/支出を統合したキャッシュフロー分析
- 会計向け科目別サマリと仕訳候補生成

## テスト
```bash
npm run test
```

## 主要ディレクトリ
- `app/` : App Routerページ
- `src/components/` : UIと画面コンポーネント
- `src/lib/` : Supabase, Auth, context, repositories, transaction/settlement service
- `supabase/migrations/` : DBスキーマ
- `supabase/policies/` : RLSポリシー
- `tests/` : Vitestユニットテスト
