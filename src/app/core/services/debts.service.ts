import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DebtDto, CreateDebtDto, SubmitPaymentDto,
  RejectDebtDto, DebtTotalByCreditorDto
} from '../models/debt.model';

export interface DebtFilter {
  status?: string;
  year?: number;
  month?: number;
  allPeriods?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DebtsService {
  private http    = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/debts`;

  private buildParams(filter: DebtFilter): HttpParams {
    let p = new HttpParams();
    if (filter.status)                p = p.set('status', filter.status);
    if (filter.year != null)          p = p.set('year', filter.year);
    if (filter.month != null)         p = p.set('month', filter.month);
    if (filter.allPeriods)            p = p.set('allPeriods', 'true');
    return p;
  }

  create(dto: CreateDebtDto): Observable<DebtDto> {
    return this.http.post<DebtDto>(this.baseUrl, dto);
  }

  getOwedByMe(filter: DebtFilter = {}): Observable<DebtDto[]> {
    return this.http.get<DebtDto[]>(`${this.baseUrl}/owed-by-me`, { params: this.buildParams(filter) });
  }

  getOwedToMe(filter: DebtFilter = {}): Observable<DebtDto[]> {
    return this.http.get<DebtDto[]>(`${this.baseUrl}/owed-to-me`, { params: this.buildParams(filter) });
  }

  getTotalsByCreditor(year: number, month: number, groupId?: string): Observable<DebtTotalByCreditorDto[]> {
    let p = new HttpParams().set('year', year).set('month', month);
    if (groupId) p = p.set('groupId', groupId);
    return this.http.get<DebtTotalByCreditorDto[]>(`${this.baseUrl}/totals-by-creditor`, { params: p });
  }

  accept(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/accept`, {});
  }

  submitPayment(id: string, dto: SubmitPaymentDto): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/submit-payment`, dto);
  }

  confirm(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/confirm`, {});
  }

  reject(id: string, dto: RejectDebtDto = {}): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/reject`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
