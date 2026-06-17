export interface PeriodExpenseDto {
  id: string;
  userId: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  type: string;
  description: string;
  amount: number;
  year: number;
  month: number;
  isPaid: boolean;
  notes: string;
}

export interface CreatePeriodExpenseDto {
  userId: string;
  categoryId?: string;
  paymentMethodId?: string;
  type: string;
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
  type: string;
  description: string;
  amount: number;
  year: number;
  month: number;
  isPaid: boolean;
  notes?: string;
}

export const PERIOD_EXPENSE_TYPES = ['Egreso', 'OtroGasto'] as const;
