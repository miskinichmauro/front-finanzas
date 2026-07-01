import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PurchaseDto, PurchaseInstallmentDto, CreatePurchaseDto, UpdatePurchaseDto, UpdatePurchaseInstallmentDto, UpcomingInstallmentDto } from '../models';

@Injectable({ providedIn: 'root' })
export class PurchasesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/purchases`;

  getAll(includeInactive = false): Observable<PurchaseDto[]> {
    const params = new HttpParams().set('includeInactive', includeInactive.toString());
    return this.http.get<PurchaseDto[]>(this.baseUrl, { params });
  }

  getInstallments(purchaseId: string): Observable<PurchaseInstallmentDto[]> {
    return this.http.get<PurchaseInstallmentDto[]>(`${this.baseUrl}/${purchaseId}/installments`);
  }

  getUpcomingInstallments(year: number, month: number): Observable<UpcomingInstallmentDto[]> {
    const params = new HttpParams().set('year', year).set('month', month);
    return this.http.get<UpcomingInstallmentDto[]>(`${this.baseUrl}/upcoming-installments`, { params });
  }

  create(dto: CreatePurchaseDto): Observable<PurchaseDto> {
    return this.http.post<PurchaseDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdatePurchaseDto): Observable<PurchaseDto> {
    return this.http.put<PurchaseDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  updateInstallment(purchaseId: string, installmentId: string, dto: UpdatePurchaseInstallmentDto): Observable<PurchaseInstallmentDto> {
    return this.http.patch<PurchaseInstallmentDto>(
      `${this.baseUrl}/${purchaseId}/installments/${installmentId}`,
      dto
    );
  }
}
