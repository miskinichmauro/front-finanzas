export interface TransactionDto {
  id: string;
  date: string;
  commerceId: string | null;
  userId: string;
  paymentMethodId: string | null;
  categoryId: string | null;
  grossAmount: number;
  netAmount: number;
  discountAmount: number;
  discountPercent: number;
  notes: string;
}

export interface CreateTransactionDto {
  date: string;
  commerceId?: string;
  userId: string;
  paymentMethodId?: string;
  categoryId?: string;
  grossAmount: number;
  netAmount: number;
  discountAmount?: number;
  discountPercent?: number;
  notes?: string;
}

export interface UpdateTransactionDto {
  date: string;
  commerceId?: string;
  userId: string;
  paymentMethodId?: string;
  categoryId?: string;
  grossAmount: number;
  netAmount: number;
  discountAmount?: number;
  discountPercent?: number;
  notes?: string;
}
