export type LoanType = 'Prestamo' | 'Ahorro';

export interface LoanDto {
  id: string;
  userId: string;
  userName: string;
  type: LoanType;
  name: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  firstDueDate: string;
  notes?: string;
  isActive: boolean;
  paidInstallments: number;
  remainingAmount: number;
}

export interface LoanInstallmentDto {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
}

export interface CreateLoanDto {
  userId: string;
  type: LoanType;
  name: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  firstDueDate: string;
  notes?: string;
}

export interface UpdateLoanDto {
  userId: string;
  type: LoanType;
  name: string;
  totalAmount: number;
  installmentAmount: number;
  notes?: string;
  isActive: boolean;
}
