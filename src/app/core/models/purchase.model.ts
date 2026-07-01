export interface PurchaseDto {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  installmentAmount: number;
  discountAmount: number;
  totalInstallments: number;
  dueDay: number;
  paymentMethodId?: string;
  paymentMethodName?: string;
  notes?: string;
  isActive: boolean;
  discountPerInstallment: number;
  netPerInstallment: number;
  paidInstallments: number;
  pendingInstallments: number;
  remainingBalance: number;
}

export interface PurchaseInstallmentDto {
  id: string;
  purchaseId: string;
  installmentNumber: number;
  dueDate: string;
  isPaid: boolean;
  paidDate?: string;
  paymentReference?: string;
  paymentDescription?: string;
}

export interface UpcomingInstallmentDto {
  installmentId: string;
  purchaseId: string;
  purchaseName: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
  paymentReference?: string;
  paymentDescription?: string;
  paymentMethodName?: string;
}

export interface CreatePurchaseDto {
  name: string;
  totalAmount: number;
  discountAmount: number;
  totalInstallments: number;
  dueDay: number;
  paymentMethodId?: string;
  notes?: string;
}

export interface UpdatePurchaseDto {
  name: string;
  totalAmount: number;
  discountAmount: number;
  paymentMethodId?: string;
  notes?: string;
  isActive: boolean;
}

export interface UpdatePurchaseInstallmentDto {
  isPaid: boolean;
  paidDate?: string;
  paymentReference?: string;
  paymentDescription?: string;
}
