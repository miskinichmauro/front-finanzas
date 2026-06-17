import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryDto, CategoryTreeDto, CreateCategoryDto, UpdateCategoryDto } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/categories`;

  getAll(): Observable<CategoryDto[]> {
    return this.http.get<CategoryDto[]>(this.baseUrl);
  }

  getTree(): Observable<CategoryTreeDto[]> {
    return this.http.get<CategoryTreeDto[]>(`${this.baseUrl}/tree`);
  }

  getById(id: string): Observable<CategoryDto> {
    return this.http.get<CategoryDto>(`${this.baseUrl}/${id}`);
  }

  create(dto: CreateCategoryDto): Observable<CategoryDto> {
    return this.http.post<CategoryDto>(this.baseUrl, dto);
  }

  update(id: string, dto: UpdateCategoryDto): Observable<CategoryDto> {
    return this.http.put<CategoryDto>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
