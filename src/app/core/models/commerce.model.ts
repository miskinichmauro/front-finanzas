export interface CommerceDto {
  id: string;
  name: string;
  address: string;
  isFavorite: boolean;
}

export interface CreateCommerceDto {
  name: string;
  address: string;
  isFavorite?: boolean;
}

export interface UpdateCommerceDto {
  name: string;
  address: string;
  isFavorite: boolean;
}
