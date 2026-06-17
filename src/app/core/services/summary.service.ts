import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MonthlySummaryDto } from '../models';

@Injectable({ providedIn: 'root' })
export class SummaryService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/summary`;

  getMonthly(year: number, month: number): Observable<MonthlySummaryDto> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('month', month.toString());
    return this.http.get<MonthlySummaryDto>(`${this.baseUrl}/monthly`, { params });
  }
}
