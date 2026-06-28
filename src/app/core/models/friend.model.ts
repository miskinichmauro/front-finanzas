export interface FriendDto {
  requestId: string;
  friendUserId: string;
  friendName: string;
  friendEmail: string;
  since: string;
}

export interface PendingFriendRequestDto {
  requestId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserEmail: string;
  sentAt: string;
}

export interface SentFriendRequestDto {
  requestId: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  sentAt: string;
}
