import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SharingGroupDto, CreateSharingGroupDto, UpdateSharingGroupDto, UpdateSharingGroupMembersDto } from '../models';

@Injectable({ providedIn: 'root' })
export class SharingGroupsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/sharing-groups`;

  getAll(includeInactive?: boolean): Observable<SharingGroupDto[]> {
    let params = new HttpParams();
    if (includeInactive !== undefined) params = params.set('includeInactive', includeInactive.toString());
    return this.http.get<SharingGroupDto[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<SharingGroupDto> {
    return this.http.get<SharingGroupDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateSharingGroupDto): Observable<SharingGroupDto> {
    return this.http.post<SharingGroupDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateSharingGroupDto): Observable<SharingGroupDto> {
    return this.http.put<SharingGroupDto>(`${this.baseUrl}/${id}`, dto);
  }

  updateMembers(id: string, dto: UpdateSharingGroupMembersDto): Observable<SharingGroupDto> {
    return this.http.put<SharingGroupDto>(`${this.baseUrl}/${id}/members`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
