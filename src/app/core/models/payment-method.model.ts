export interface PaymentMethodDto {
  id: string;
  name: string;
  type: string;
  bankName: string;
  lastDigits: string;
  isActive: boolean;
}

export interface CreatePaymentMethodDto {
  name: string;
  type: string;
  bankName: string;
  lastDigits: string;
  isActive?: boolean;
}

export interface UpdatePaymentMethodDto {
  name: string;
  type: string;
  bankName: string;
  lastDigits: string;
  isActive: boolean;
}
