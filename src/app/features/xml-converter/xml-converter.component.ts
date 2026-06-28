import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-xml-converter',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent
  ],
  templateUrl: './xml-converter.component.html',
  styleUrl: './xml-converter.component.scss'
})
export class XmlConverterComponent {
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  selectedFile = signal<File | null>(null);
  loading = signal(false);
  isDragOver = signal(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    if (!file.name.toLowerCase().endsWith('.xml')) {
      this.snackBar.open('Solo se aceptan archivos XML', 'Cerrar', { duration: 3000 });
      return;
    }
    this.selectedFile.set(file);
  }

  convert(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.loading.set(true);
    const form = new FormData();
    form.append('File', file);

    this.http.post(`${environment.apiUrl}/xml-to-excel`, form, { responseType: 'blob', observe: 'response' })
      .subscribe({
        next: response => {
          const blob = response.body!;
          const disposition = response.headers.get('content-disposition') ?? '';
          const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          const filename = match ? match[1].replace(/['"]/g, '') : 'factura.xlsx';

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          this.loading.set(false);
          this.selectedFile.set(null);
          this.snackBar.open('Excel generado correctamente', 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Error al procesar el XML', 'Cerrar', { duration: 4000 });
        }
      });
  }

  clear(): void {
    this.selectedFile.set(null);
  }
}
