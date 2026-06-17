import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SharedCommitmentSplitDto, SplitAdjustmentDto, CreateSplitAdjustmentDto, UpdateSplitAdjustmentDto, SplitPeriodStatusDto } from '../models';

@Injectable({ providedIn: 'root' })
export class SplitService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api`;

  calculateSplit(sharingGroupId: string, year: number, month: number): Observable<SharedCommitmentSplitDto> {
    const params = new HttpParams()
      .set('sharingGroupId', sharingGroupId)
      .set('year', year.toString())
      .set('month', month.toString());
    return this.http.get<SharedCommitmentSplitDto>(`${this.baseUrl}/shared-commitments/split`, { params });
  }

  getAdjustments(sharingGroupId: string, year: number, month: number): Observable<SplitAdjustmentDto[]> {
    const params = new HttpParams()
      .set('sharingGroupId', sharingGroupId)
      .set('year', year.toString())
      .set('month', month.toString());
    return this.http.get<SplitAdjustmentDto[]>(`${this.baseUrl}/split-adjustments`, { params });
  }

  createAdjustment(dto: CreateSplitAdjustmentDto): Observable<SplitAdjustmentDto> {
    return this.http.post<SplitAdjustmentDto>(`${this.baseUrl}/split-adjustments`, dto);
  }

  updateAdjustment(id: string, dto: UpdateSplitAdjustmentDto): Observable<SplitAdjustmentDto> {
    return this.http.put<SplitAdjustmentDto>(`${this.baseUrl}/split-adjustments/${id}`, dto);
  }

  deleteAdjustment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/split-adjustments/${id}`);
  }

  getPeriodStatus(sharingGroupId: string, year: number, month: number): Observable<SplitPeriodStatusDto> {
    return this.http.get<SplitPeriodStatusDto>(`${this.baseUrl}/split-period-status/${sharingGroupId}/${year}/${month}`);
  }

  updatePeriodStatus(sharingGroupId: string, year: number, month: number, isPaid: boolean): Observable<SplitPeriodStatusDto> {
    return this.http.put<SplitPeriodStatusDto>(`${this.baseUrl}/split-period-status/${sharingGroupId}/${year}/${month}`, { isPaid });
  }
}
