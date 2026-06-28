import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SharedCommitmentDto, CreateSharedCommitmentDto, UpdateSharedCommitmentDto } from '../models';

@Injectable({ providedIn: 'root' })
export class SharedCommitmentsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/shared-commitments`;

  getAll(sharingGroupId?: string, includeInactive?: boolean): Observable<SharedCommitmentDto[]> {
    let params = new HttpParams();
    if (sharingGroupId) params = params.set('sharingGroupId', sharingGroupId);
    if (includeInactive !== undefined) params = params.set('includeInactive', includeInactive.toString());
    return this.http.get<SharedCommitmentDto[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<SharedCommitmentDto> {
    return this.http.get<SharedCommitmentDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateSharedCommitmentDto): Observable<SharedCommitmentDto> {
    return this.http.post<SharedCommitmentDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateSharedCommitmentDto): Observable<SharedCommitmentDto> {
    return this.http.put<SharedCommitmentDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
