import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FriendDto, PendingFriendRequestDto, SentFriendRequestDto } from '../models';

@Injectable({ providedIn: 'root' })
export class FriendsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/friends`;

  getMyFriends(): Observable<FriendDto[]> {
    return this.http.get<FriendDto[]>(this.baseUrl);
  }

  getPendingRequests(): Observable<PendingFriendRequestDto[]> {
    return this.http.get<PendingFriendRequestDto[]>(`${this.baseUrl}/pending`);
  }

  getSentRequests(): Observable<SentFriendRequestDto[]> {
    return this.http.get<SentFriendRequestDto[]>(`${this.baseUrl}/sent`);
  }

  sendRequest(addresseeId: string): Observable<SentFriendRequestDto> {
    return this.http.post<SentFriendRequestDto>(`${this.baseUrl}/${addresseeId}`, {});
  }

  acceptRequest(requestId: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${requestId}/accept`, {});
  }

  remove(requestId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${requestId}`);
  }
}
