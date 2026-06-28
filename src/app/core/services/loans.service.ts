import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoanDto, LoanInstallmentDto, CreateLoanDto, UpdateLoanDto, LoanType } from '../models';

@Injectable({ providedIn: 'root' })
export class LoansService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/loans`;

  getAll(type?: LoanType, includeInactive = false): Observable<LoanDto[]> {
    let params = new HttpParams().set('includeInactive', includeInactive.toString());
    if (type) params = params.set('type', type);
    return this.http.get<LoanDto[]>(this.baseUrl, { params });
  }

  getInstallments(loanId: string): Observable<LoanInstallmentDto[]> {
    return this.http.get<LoanInstallmentDto[]>(`${this.baseUrl}/${loanId}/installments`);
  }

  create(dto: CreateLoanDto): Observable<LoanDto> {
    return this.http.post<LoanDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateLoanDto): Observable<LoanDto> {
    return this.http.put<LoanDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updateInstallment(loanId: string, installmentId: string, isPaid: boolean): Observable<LoanInstallmentDto> {
    return this.http.patch<LoanInstallmentDto>(
      `${this.baseUrl}/${loanId}/installments/${installmentId}`,
      { isPaid }
    );
  }
}
