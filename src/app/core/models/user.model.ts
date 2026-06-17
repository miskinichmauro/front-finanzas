export interface UserDto {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CreateUserDto {
  name: string;
  isActive?: boolean;
}

export interface UpdateUserDto {
  name: string;
  isActive: boolean;
}
