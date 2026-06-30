export interface SplitBalanceDto {
  userId: string;
  userName: string;
  totalIncome: number;
  totalFixedExpenses: number;
  availableBalance: number;
}

export interface SplitShareDto {
  userId: string;
  userName: string;
  amount: number;
}

export interface SplitItemDto {
  id: string;
  categoryName: string;
  description: string;
  amount: number;
  percent: number;
  paidByUserId: string | null;
  paidByUserName: string | null;
  isVariableBudget: boolean;
  monthlyBudget: number | null;
  actualAmount: number | null;
  previousMonthSurplus: number;
  shares: SplitShareDto[];
}

export interface SplitTransferDto {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
}

export interface SplitTotalDto {
  userId: string;
  userName: string;
  availableBalance: number;
  totalAssigned: number;
  remainder: number;
}

export interface SplitAdjustmentDto {
  id: string;
  userId: string;
  userName: string;
  description: string;
  amount: number;
  displayOrder: number;
}

export interface SplitCarryOverDto {
  id: string;
  userId: string;
  userName: string;
  description: string;
  amount: number;
  displayOrder: number;
}

export interface SplitFinalTotalDto {
  userId: string;
  userName: string;
  proportionalAmount: number;
  adjustmentsTotal: number;
  carryOverTotal: number;
  finalAmount: number;
}

export interface SharedCommitmentSplitDto {
  sharingGroupId: string;
  sharingGroupName: string;
  year: number;
  month: number;
  totalAvailable: number;
  balances: SplitBalanceDto[];
  items: SplitItemDto[];
  totals: SplitTotalDto[];
  previousMonthIsPaid: boolean;
  adjustments: SplitAdjustmentDto[];
  carryOver: SplitCarryOverDto[];
  finalTotals: SplitFinalTotalDto[];
  transfers: SplitTransferDto[];
}

export interface CreateSplitAdjustmentDto {
  sharingGroupId: string;
  year: number;
  month: number;
  userId: string;
  description: string;
  amount: number;
  displayOrder: number;
}

export interface UpdateSplitAdjustmentDto {
  userId: string;
  description: string;
  amount: number;
  displayOrder: number;
}

export interface SplitPeriodStatusDto {
  sharingGroupId: string;
  year: number;
  month: number;
  isPaid: boolean;
}
