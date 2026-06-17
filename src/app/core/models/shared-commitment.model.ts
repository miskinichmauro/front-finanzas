export interface SharedCommitmentDto {
  id: string;
  sharingGroupId: string;
  section: string;
  description: string;
  categoryId: string | null;
  paymentMethodId: string | null;
  amount: number;
  displayOrder: number;
  notes: string;
  isActive: boolean;
}

export interface CreateSharedCommitmentDto {
  sharingGroupId: string;
  section: string;
  description: string;
  categoryId?: string;
  paymentMethodId?: string;
  amount: number;
  displayOrder?: number;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateSharedCommitmentDto {
  sharingGroupId: string;
  section: string;
  description: string;
  categoryId?: string;
  paymentMethodId?: string;
  amount: number;
  displayOrder?: number;
  notes?: string;
  isActive: boolean;
}

export const SHARED_COMMITMENT_SECTIONS = [
  'Activos',
  'Consumos',
  'Ahorros',
  'StreamingTigoTv',
  'CuotasPrestamo',
  'Servicios'
] as const;
