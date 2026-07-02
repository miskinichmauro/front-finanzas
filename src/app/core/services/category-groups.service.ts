import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryGroupDto, SaveCategoryGroupDto } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryGroupsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/category-groups`;

  getAll(): Observable<CategoryGroupDto[]> { return this.http.get<CategoryGroupDto[]>(this.baseUrl); }
  create(dto: SaveCategoryGroupDto): Observable<CategoryGroupDto> { return this.http.post<CategoryGroupDto>(this.baseUrl, dto); }
  update(id: string, dto: SaveCategoryGroupDto): Observable<CategoryGroupDto> { return this.http.put<CategoryGroupDto>(`${this.baseUrl}/${id}`, dto); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.baseUrl}/${id}`); }
}
