export interface CategoryDto {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
}

export interface CategoryGroupDto {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface SaveCategoryGroupDto { name: string; }

export interface CategoryTreeDto {
  id: string;
  name: string;
  children: CategoryTreeDto[];
}

export interface CreateCategoryDto {
  name: string;
  groupId: string;
}

export interface UpdateCategoryDto {
  name: string;
  groupId: string;
}
