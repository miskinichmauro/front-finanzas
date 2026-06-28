export interface TransactionDto {
  id: string;
  date: string;
  description: string | null;
  commerceId: string | null;
  userId: string;
  paymentMethodId: string | null;
  categoryId: string | null;
  grossAmount: number;
  netAmount: number;
  discountAmount: number;
  discountPercent: number;
  notes: string;
  invoiceId: string | null;
}

export interface CreateTransactionDto {
  date: string;
  description?: string;
  commerceId?: string;
  userId: string;
  paymentMethodId?: string;
  categoryId?: string;
  grossAmount: number;
  netAmount: number;
  discountAmount?: number;
  discountPercent?: number;
  notes?: string;
  invoiceId?: string;
}

export interface UpdateTransactionDto {
  date: string;
  description?: string;
  commerceId?: string;
  userId: string;
  paymentMethodId?: string;
  categoryId?: string;
  grossAmount: number;
  netAmount: number;
  discountAmount?: number;
  discountPercent?: number;
  notes?: string;
  invoiceId?: string;
}
