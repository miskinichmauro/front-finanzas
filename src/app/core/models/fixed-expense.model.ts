export interface FixedExpenseDto {
  id: string;
  userId: string;
  categoryId: string;
  paymentMethodId: string | null;
  description: string;
  amount: number;
  dueDay: number | null;
  notes: string;
  isActive: boolean;
}

export interface CreateFixedExpenseDto {
  userId: string;
  categoryId: string;
  paymentMethodId?: string;
  description: string;
  amount: number;
  dueDay?: number;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateFixedExpenseDto {
  userId: string;
  categoryId: string;
  paymentMethodId?: string;
  description: string;
  amount: number;
  dueDay?: number;
  notes?: string;
  isActive: boolean;
}
