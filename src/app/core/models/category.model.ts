export interface CategoryDto {
  id: string;
  name: string;
  parentCategoryId: string | null;
}

export interface CategoryTreeDto {
  id: string;
  name: string;
  children: CategoryTreeDto[];
}

export interface CreateCategoryDto {
  name: string;
  parentCategoryId?: string;
}

export interface UpdateCategoryDto {
  name: string;
  parentCategoryId?: string;
}
