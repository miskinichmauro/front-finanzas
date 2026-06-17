import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommerceDto, CreateCommerceDto, UpdateCommerceDto } from '../models';

@Injectable({ providedIn: 'root' })
export class CommercesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/commerces`;

  getAll(isFavorite?: boolean): Observable<CommerceDto[]> {
    let params = new HttpParams();
    if (isFavorite !== undefined) {
      params = params.set('isFavorite', isFavorite.toString());
    }
    return this.http.get<CommerceDto[]>(this.baseUrl, { params });
  }

  getById(id: string): Observable<CommerceDto> {
    return this.http.get<CommerceDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCommerceDto): Observable<CommerceDto> {
    return this.http.post<CommerceDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateCommerceDto): Observable<CommerceDto> {
    return this.http.put<CommerceDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
