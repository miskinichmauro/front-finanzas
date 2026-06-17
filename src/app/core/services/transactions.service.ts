import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TransactionDto, CreateTransactionDto, UpdateTransactionDto } from '../models';

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/transactions`;

  getAll(filters?: { year?: number; month?: number; userId?: string; categoryId?: string; paymentMethodId?: string; commerceId?: string }): Observable<TransactionDto[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.year !== undefined) params = params.set('year', filters.year.toString());
      if (filters.month !== undefined) params = params.set('month', filters.month.toString());
      if (filters.userId) params = params.set('userId', filters.userId);
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId);
      if (filters.paymentMethodId) params = params.set('paymentMethodId', filters.paymentMethodId);
      if (filters.commerceId) params = params.set('commerceId', filters.commerceId);
    }
    return this.http.get<TransactionDto[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<TransactionDto> {
    return this.http.get<TransactionDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateTransactionDto): Observable<TransactionDto> {
    return this.http.post<TransactionDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateTransactionDto): Observable<TransactionDto> {
    return this.http.put<TransactionDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
