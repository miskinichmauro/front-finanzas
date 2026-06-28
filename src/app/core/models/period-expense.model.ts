export interface PeriodExpenseDto {
  id: string;
  userId: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  description: string;
  amount: number;
  year: number;
  month: number;
  isPaid: boolean;
  paidAt: string | null;
  receiptNumber: string | null;
  paymentDescription: string | null;
  notes: string;
}

export interface CreatePeriodExpenseDto {
  userId: string;
  categoryId?: string;
  paymentMethodId?: string;
  description: string;
  amount: number;
  year: number;
  month: number;
  isPaid?: boolean;
  notes?: string;
}

export interface UpdatePeriodExpenseDto {
  userId: string;
  categoryId?: string;
  paymentMethodId?: string;
  description: string;
  amount: number;
  year: number;
  month: number;
  isPaid: boolean;
  notes?: string;
}


export interface RegisterPeriodExpensePaymentDto {
  receiptNumber: string;
  paymentDescription?: string | null;
  paidAt?: string | null;
}
