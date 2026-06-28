export enum UserRole {
  User  = 'User',
  Admin = 'Admin'
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
}

export interface UpdateUserDto {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}
