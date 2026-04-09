export type LedgerType = "family" | "work" | "custom";
export type PresetStatus = "draft" | "published" | "archived";
export type SplitMethod = "equal" | "ratio" | "weight" | "mixed_fixed" | "fixed_mixed";
export type RoundingMode = "round" | "ceil" | "floor";

export interface Household {
  id: string;
  name: string;
  ownerUserId: string;
}

export interface Ledger {
  id: string;
  householdId: string;
  name: string;
  type: LedgerType;
  currency: string;
}

export interface Category {
  id: string;
  ledgerId: string;
  name: string;
  color: string;
}

export interface Membership {
  id: string;
  householdId: string;
  userId: string;
  role: string;
}

export interface HouseholdOption {
  id: string;
  name: string;
}

export interface LedgerOption {
  id: string;
  householdId: string;
  name: string;
  type: LedgerType;
  currency: string;
}

export interface CategoryOption {
  id: string;
  name: string;
  color: string;
  ledgerId: string;
}

export interface MemberOption {
  membershipId: string;
  userId: string;
  role: string;
  name: string;
}

export interface Transaction {
  id: string;
  ledgerId: string;
  categoryId: string;
  amount: number;
  payerMembershipId: string;
  note?: string;
  date: string;
  receiptPath?: string;
}

export interface DashboardTransactionRecord {
  id: string;
  date: string;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
}

export interface DashboardSummary {
  yearMonth: string;
  totalSpent: number;
  transactionCount: number;
  previousMonthTotalSpent: number;
  diffFromPreviousMonth: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  totalSpent: number;
  percentage: number;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  totalSpent: number;
}

export interface DashboardAggregationResult {
  summary: DashboardSummary;
  categories: CategorySummary[];
  timeSeries: TimeSeriesPoint[];
  budgetProgress: BudgetProgressSummary;
}

export type DashboardCategorySummary = CategorySummary;
export type DashboardTimeSeriesPoint = TimeSeriesPoint;

export interface Budget {
  id: string;
  householdId: string;
  ledgerId: string;
  categoryId: string | null;
  period: string;
  amount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetWithCategory extends Budget {
  categoryName: string | null;
}

export interface BudgetProgressItem {
  budgetId: string;
  categoryId: string | null;
  categoryName: string;
  period: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  progressRate: number;
  isOverBudget: boolean;
}

export interface BudgetProgressSummary {
  period: string;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  totalProgressRate: number;
  hasOverBudget: boolean;
  items: BudgetProgressItem[];
}

export type NotificationType = "budget_exceeded" | "settlement_pending";
export type NotificationChannel = "push" | "email";

export interface NotificationItem {
  id: string;
  userId: string;
  householdId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  channel: NotificationChannel | null;
  pushSentAt: string | null;
}

export interface SplitInputMember {
  memberId: string;
  ratio?: number;
  weight?: number;
  fixedAmount?: number;
}

export interface SplitResult {
  memberId: string;
  amount: number;
}

export interface SettlementEdge {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

export interface TransactionListItem {
  id: string;
  date: string;
  categoryName: string;
  amount: number;
  payerName: string;
  note: string;
  presetName: string | null;
}

export interface MemberSettlementSummary {
  memberId: string;
  paid: number;
  owed: number;
  net: number;
}

export interface SettlementRecordInput {
  householdId: string;
  ledgerId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  method: string;
  note?: string;
  settledOn: string;
}

export interface PresetCondition {
  minAmount?: number;
  keywords?: string[];
  weekdays?: number[];
  merchantName?: string;
}

export interface PresetMemberConfig {
  memberId: string;
  ratio?: number;
  weight?: number;
  fixedAmount?: number;
}

export interface CategorySplitPreset {
  id: string;
  name: string;
  status: PresetStatus;
  priority: number;
  targetCategoryIds: string[];
  splitMethod: SplitMethod;
  roundingMode: RoundingMode;
  conditions?: PresetCondition;
  members: PresetMemberConfig[];
  updatedAt: string;
}

export interface PresetMatchInput {
  categoryId: string;
  amount: number;
  note?: string;
  transactionDate: string;
  merchantName?: string;
}
