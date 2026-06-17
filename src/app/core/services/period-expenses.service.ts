import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PeriodExpenseDto, CreatePeriodExpenseDto, UpdatePeriodExpenseDto } from '../models';

@Injectable({ providedIn: 'root' })
export class PeriodExpensesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/period-expenses`;

  getAll(userId?: string, year?: number, month?: number, type?: string): Observable<PeriodExpenseDto[]> {
    let params = new HttpParams();
    if (userId) params = params.set('userId', userId);
    if (year !== undefined) params = params.set('year', year.toString());
    if (month !== undefined) params = params.set('month', month.toString());
    if (type) params = params.set('type', type);
    return this.http.get<PeriodExpenseDto[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<PeriodExpenseDto> {
    return this.http.get<PeriodExpenseDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreatePeriodExpenseDto): Observable<PeriodExpenseDto> {
    return this.http.post<PeriodExpenseDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdatePeriodExpenseDto): Observable<PeriodExpenseDto> {
    return this.http.put<PeriodExpenseDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
