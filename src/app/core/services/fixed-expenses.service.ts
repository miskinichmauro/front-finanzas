import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FixedExpenseDto, CreateFixedExpenseDto, UpdateFixedExpenseDto } from '../models';

@Injectable({ providedIn: 'root' })
export class FixedExpensesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/fixed-expenses`;

  getAll(userId?: string, includeInactive?: boolean): Observable<FixedExpenseDto[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId);
    if (includeInactive !== undefined) params = params.set('includeInactive', includeInactive.toString());
    return this.http.get<FixedExpenseDto[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<FixedExpenseDto> {
    return this.http.get<FixedExpenseDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateFixedExpenseDto): Observable<FixedExpenseDto> {
    return this.http.post<FixedExpenseDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateFixedExpenseDto): Observable<FixedExpenseDto> {
    return this.http.put<FixedExpenseDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
