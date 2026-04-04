export type LedgerType = "family" | "work" | "custom";
export type PresetStatus = "draft" | "published" | "archived";
export type SplitMethod = "equal" | "ratio" | "weight" | "fixed_mixed";
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

export interface PresetCondition {
  minAmount?: number;
  keywords?: string[];
  weekdays?: number[];
  merchantName?: string;
}
