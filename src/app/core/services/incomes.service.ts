import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IncomeDto, CreateIncomeDto, UpdateIncomeDto } from '../models';

@Injectable({ providedIn: 'root' })
export class IncomesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/incomes`;

  getAll(year?: number, month?: number): Observable<IncomeDto[]> {
    let params = new HttpParams();
    if (year !== undefined) params = params.set('year', year.toString());
    if (month !== undefined) params = params.set('month', month.toString());
    return this.http.get<IncomeDto[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<IncomeDto> {
    return this.http.get<IncomeDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateIncomeDto): Observable<IncomeDto> {
    return this.http.post<IncomeDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateIncomeDto): Observable<IncomeDto> {
    return this.http.put<IncomeDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
