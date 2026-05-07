# SubscNote 要件定義（MVP）

## 1. 依頼内容の要約

スマホ向けフォームUIを参考にした、**サブスクリプション管理アプリ**を構築する。転職用ポートフォリオとして、実務に近い設計・実装・説明可能性を重視する。

- 実務に近い画面・CRUD・フォーム設計
- サブスク支出の見える化
- 更新日・解約忘れ防止
- レスポンシブ対応
- 認証・DB・API・バリデーション
- READMEや設計意図の明文化

## 2. 目的

### プロダクト目的
ユーザーが契約中サブスクを登録し、**毎月・年間支出、次回更新日、解約検討対象**を一目で把握できるようにする。

### ポートフォリオ目的
採用担当者に以下を示す。

- Next.js / React / TypeScript による実用アプリ実装力
- CRUD、フォーム、一覧、検索、集計の設計力
- API / DB / UI の責務分離
- バリデーション・エラー処理・空状態の設計
- 業務ロジック（月換算・更新日判定）の実装力
- READMEで設計判断を説明する力

## 3. 前提・仮定

- 個人ユーザー向け
- スマホ表示を重視（PCレスポンシブ対応）
- 認証ありの個人管理
- MVPでは支払い履歴は対象外
- 通知は画面上表示まで（メール通知は後続）
- 決済連携・銀行連携は対象外

### MVP対象外

- クレジットカード連携
- 銀行API連携
- 自動課金検知
- 本格メール通知
- チーム・家族共有
- AI節約提案
- ネイティブアプリ化

## 4. プロダクト名案

### ベスト案
**SubscNote**

### 代替案
- SubscBoard
- Subscription Keeper
- SabuMemo
- FixedCost Manager
- Monthly Keeper

## 5. MVP要件定義

### 5-1. MVPゴール

1. ユーザー登録・ログイン
2. サブスク登録
3. サブスク一覧表示
4. 月額・年額合計の確認
5. 次回更新日が近いサブスク確認
6. 編集・削除
7. カテゴリ・周期絞り込み
8. 解約検討中サブスク管理

## 6. 機能要件

### 6-1. 認証

**必須機能**
- ユーザー登録
- ログイン
- ログアウト
- ログインユーザー単位のデータ分離

**受け入れ条件**
- 未ログインで管理画面に入れない
- 他ユーザーデータを参照不可
- ログアウト後は再ログイン必須
- メール形式・パスワード長の妥当性チェック

### 6-2. サブスク登録

| 項目 | 必須 | 内容 |
| --- | ---: | --- |
| サービス名 | 必須 | Netflix, Spotify, ChatGPT など |
| カテゴリ | 必須 | 動画、音楽、学習、仕事、生活、その他 |
| 金額 | 必須 | 支払い金額 |
| 通貨 | 任意 | 初期はJPY固定可 |
| 支払い周期 | 必須 | 月額、年額、週額 |
| 初回契約日 | 任意 | 契約開始日 |
| 次回更新日 | 必須 | 次回課金日 |
| 支払い方法 | 任意 | クレカ、デビット、銀行、PayPayなど |
| 利用状況 | 必須 | 利用中、解約検討中、解約済み |
| メモ | 任意 | 解約理由、用途など |

**受け入れ条件**
- 必須未入力では保存不可
- 金額0以下は不可
- 日付として不正な値は不可
- 登録後に一覧へ即時反映
- ログインユーザーに紐付いて保存

### 6-3. サブスク一覧

**表示項目**
- サービス名
- カテゴリ
- 月換算金額
- 支払い周期
- 次回更新日
- 利用状況
- 解約検討フラグ

**操作**
- 詳細 / 編集 / 削除
- 利用状況変更
- 検索
- カテゴリ絞り込み
- 支払い周期絞り込み
- 更新日順・金額順ソート

**受け入れ条件**
- 0件時の空状態表示
- 検索0件時の明示
- 削除確認ダイアログ
- スマホ可読性の高いカードUI

### 6-4. ダッシュボード

**表示内容**
- 今月合計支出
- 年間換算支出
- 登録件数
- 解約検討中件数
- 7日以内更新対象
- カテゴリ別支出
- 高額サブスク上位

**受け入れ条件**
- 月額・年額・週額を月換算して集計
- 年額: `年額 ÷ 12`
- 週額: `週額 × 52 ÷ 12`
- 解約済みは集計から除外
- 解約検討中は集計に含める
- 更新日が近い順に表示

### 6-5. 詳細

**表示項目**
- サービス名 / カテゴリ / 金額 / 支払い周期
- 月換算金額 / 年間換算金額
- 次回更新日 / 支払い方法 / 利用状況 / メモ
- 作成日 / 更新日

**受け入れ条件**
- URL直打ちで他ユーザー詳細は表示不可
- 存在しないIDは404相当
- 編集内容が即反映

## 7. 画面設計

| 画面 | パス例 | 目的 |
| --- | --- | --- |
| LP / トップ | `/` | アプリ概要 |
| ログイン | `/login` | ログイン |
| 新規登録 | `/signup` | アカウント作成 |
| ダッシュボード | `/dashboard` | 支出確認 |
| 一覧 | `/subscriptions` | 管理 |
| 新規登録 | `/subscriptions/new` | 登録 |
| 詳細 | `/subscriptions/[id]` | 詳細確認 |
| 編集 | `/subscriptions/[id]/edit` | 編集 |
| 設定 | `/settings` | アカウント設定 |

### スマホUI方針
- 広めの余白
- 入力項目の縦並び
- 必須項目の明確化
- カード単位でのセクション分割
- 下部固定保存ボタン（必要に応じて）

## 8. データ設計

### 8-1. ERDイメージ

```text
users
  └── subscriptions
          ├── categories
          └── payment_methods
```

### 8-2. users
- id (uuid)
- email (string)
- password_hash (string)
- created_at (datetime)
- updated_at (datetime)

### 8-3. subscriptions
- id (uuid)
- user_id (uuid)
- name (string)
- category (string)
- amount (integer)
- billing_cycle (string)
- started_on (date, nullable)
- next_billing_on (date)
- payment_method (string, nullable)
- status (string)
- memo (text, nullable)
- created_at (datetime)
- updated_at (datetime)

### 8-4. enum

```ts
type SubscriptionCategory =
  | "video"
  | "music"
  | "learning"
  | "work"
  | "life"
  | "game"
  | "other";

type BillingCycle = "weekly" | "monthly" | "yearly";

type SubscriptionStatus =
  | "active"
  | "considering_cancellation"
  | "cancelled";

type PaymentMethod =
  | "credit_card"
  | "debit_card"
  | "bank_transfer"
  | "qr_payment"
  | "app_store"
  | "google_play"
  | "other";
```

## 9. API設計

### 認証API
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### サブスクAPI
- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `GET /api/subscriptions/:id`
- `PATCH /api/subscriptions/:id`
- `DELETE /api/subscriptions/:id`

### ダッシュボードAPI
- `GET /api/dashboard/summary`

## 10. 技術選定

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Auth.js または Supabase Auth
- Zod
- Vitest / Testing Library / Playwright
- Vercel
- pnpm

## 11. 推奨アーキテクチャ

```text
Browser
  ↓
Next.js App Router
  ├── Server Components
  ├── Client Components
  ├── Route Handlers
  ↓
Service Layer
  ↓
Repository Layer
  ↓
PostgreSQL
```

## 12. 主要ロジック

### 月換算
```ts
export function calculateMonthlyCost(amount: number, billingCycle: BillingCycle): number {
  switch (billingCycle) {
    case "weekly":
      return Math.round((amount * 52) / 12);
    case "monthly":
      return amount;
    case "yearly":
      return Math.round(amount / 12);
    default:
      throw new Error("Unsupported billing cycle");
  }
}
```

### 更新日判定
```ts
export function isUpcomingRenewal(nextBillingOn: Date, today: Date, days: number): boolean {
  const diffTime = nextBillingOn.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays <= days;
}
```

## 13. 実装フェーズ

1. 土台作成（Next.js, Tailwind, lint/build）
2. DB・モデル設計（Prisma, migration, seed）
3. CRUD実装（一覧/詳細/登録/編集/削除）
4. ダッシュボード実装（集計・近日期限）
5. 認証・認可（データ分離・保護）
6. テスト・仕上げ（Unit/E2E、README、docs）

## 14. テスト観点

- 正常系: 認証、CRUD、集計表示
- 異常系: 必須欠落、不正金額、不正日付、未ログインアクセス
- 境界値: 金額1円、7日/8日判定、週額/年額換算
- 認可: 他ユーザーのデータ参照・更新・削除不可
- 回帰: フォーム変更、enum追加、集計条件変更、認証導線

## 15. リスクと対策

1. ただのCRUDに見える
   - 月換算、更新日管理、解約検討、カテゴリ集計を実装
2. 認証・認可が弱い
   - 全操作で `user_id` 条件、API側認証必須
3. 日付計算が曖昧
   - 共通utility化、タイムゾーン考慮、Unit Test
4. UI偏重で中身が薄い
   - 責務分離、テスト、READMEで設計意図明記

## 16. MVP後の追加候補

1. カテゴリ別支出グラフ
2. 更新日7日前通知風表示
3. 解約候補リスト
4. 検索条件のURL保持
5. テスト拡充
6. README強化

## 17. 最終結論

**Next.js + TypeScript + Prisma + PostgreSQL でスマホファーストのサブスク管理アプリを実装する。**

MVP完了条件:
- 認証
- サブスクCRUD
- ダッシュボード集計
- 近い更新日表示
- 解約検討ステータス
- スマホ対応UI
- バリデーション
- ユーザーごとのデータ分離
- 最低限のテスト
- README / docs整備
