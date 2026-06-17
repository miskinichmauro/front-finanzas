export interface SharingGroupMemberDto {
  userId: string;
  userName: string;
}

export interface SharingGroupDto {
  id: string;
  name: string;
  isActive: boolean;
  members: SharingGroupMemberDto[];
}

export interface CreateSharingGroupDto {
  name: string;
  isActive?: boolean;
}

export interface UpdateSharingGroupDto {
  name: string;
  isActive: boolean;
}

export interface UpdateSharingGroupMembersDto {
  userIds: string[];
}
