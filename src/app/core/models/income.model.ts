export interface IncomeDto {
  id: string;
  userId: string;
  categoryId: string | null;
  description: string;
  amount: number;
  date: string;
  isRecurring: boolean;
}

export interface CreateIncomeDto {
  userId: string;
  categoryId?: string;
  description: string;
  amount: number;
  date: string;
  isRecurring?: boolean;
}

export interface UpdateIncomeDto {
  userId: string;
  categoryId?: string;
  description: string;
  amount: number;
  date: string;
  isRecurring: boolean;
}
