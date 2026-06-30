export interface PaymentMethodDto {
  id: string;
  name: string;
  bankName: string;
  lastDigits: string;
  isActive: boolean;
}

export interface CreatePaymentMethodDto {
  name: string;
  bankName: string;
  lastDigits: string;
  isActive?: boolean;
}

export interface UpdatePaymentMethodDto {
  name: string;
  bankName: string;
  lastDigits: string;
  isActive: boolean;
}
