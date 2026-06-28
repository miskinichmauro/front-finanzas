import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { XmlInvoiceDto } from '../models';

@Injectable({ providedIn: 'root' })
export class XmlParseService {
  private readonly http = inject(HttpClient);

  parseXml(file: File): Observable<XmlInvoiceDto> {
    const formData = new FormData();
    formData.append('File', file);
    return this.http.post<XmlInvoiceDto>(
      `${environment.apiUrl}/api/xml/parse`,
      formData,
      { withCredentials: true }
    );
  }
}
