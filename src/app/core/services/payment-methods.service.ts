import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentMethodDto, CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentMethodsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/payment-methods`;

  getAll(): Observable<PaymentMethodDto[]> {
    return this.http.get<PaymentMethodDto[]>(this.baseUrl);
  }

  getById(id: string): Observable<PaymentMethodDto> {
    return this.http.get<PaymentMethodDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreatePaymentMethodDto): Observable<PaymentMethodDto> {
    return this.http.post<PaymentMethodDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdatePaymentMethodDto): Observable<PaymentMethodDto> {
    return this.http.put<PaymentMethodDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
