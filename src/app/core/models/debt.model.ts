export type DebtStatus = 'Pending' | 'Accepted' | 'AwaitingConfirmation' | 'Paid' | 'Rejected';

export interface DebtDto {
  id: string;
  creditorUserId: string;
  creditorUserName: string;
  debtorUserId: string;
  debtorUserName: string;
  amount: number;
  description: string;
  date: string;
  status: DebtStatus;
  acceptedAt: string | null;
  paymentSubmittedAt: string | null;
  paymentReference: string | null;
  paymentDescription: string | null;
  confirmedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

export interface CreateDebtDto {
  creditorUserId: string;
  debtorUserId: string;
  amount: number;
  description: string;
  date: string;
}

export interface SubmitPaymentDto {
  paymentReference: string;
  paidAt?: string | null;
  paymentDescription?: string | null;
}

export interface RejectDebtDto {
  rejectionReason?: string | null;
}

export interface DebtTotalByCreditorDto {
  creditorUserId: string;
  creditorUserName: string;
  total: number;
}
