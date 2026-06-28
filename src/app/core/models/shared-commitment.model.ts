export interface SharedCommitmentDto {
  id: string;
  sharingGroupId: string;
  date: string;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  commerceId: string | null;
  paymentMethodId: string | null;
  paidByUserId: string | null;
  paidByUserName: string | null;
  grossAmount: number;
  discountPercent: number;
  discountAmount: number;
  netAmount: number;
  displayOrder: number;
  notes: string;
  isActive: boolean;
  isVariableBudget: boolean;
  monthlyBudget: number | null;
  linkedCategoryId: string | null;
}

export interface CreateSharedCommitmentDto {
  sharingGroupId: string;
  date: string;
  categoryId: string;
  commerceId?: string;
  description: string;
  paymentMethodId?: string;
  paidByUserId?: string;
  grossAmount: number;
  discountPercent?: number;
  displayOrder?: number;
  notes?: string;
  isActive?: boolean;
  isVariableBudget?: boolean;
  monthlyBudget?: number;
  linkedCategoryId?: string;
}

export interface UpdateSharedCommitmentDto {
  sharingGroupId: string;
  date: string;
  categoryId: string;
  commerceId?: string;
  description: string;
  paymentMethodId?: string;
  paidByUserId?: string;
  grossAmount: number;
  discountPercent?: number;
  displayOrder?: number;
  notes?: string;
  isActive: boolean;
  isVariableBudget?: boolean;
  monthlyBudget?: number;
  linkedCategoryId?: string;
}
