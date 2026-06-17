import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SummaryService } from '../../core/services/summary.service';
import { MonthlySummaryDto } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    PageHeaderComponent
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  private summaryService = inject(SummaryService);

  loading = signal(false);
  summary = signal<MonthlySummaryDto | null>(null);

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading.set(true);
    this.summaryService.getMonthly(this.currentYear, this.currentMonth).subscribe({
      next: data => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  getSummaryEntries(): { key: string; value: unknown }[] {
    const s = this.summary();
    if (!s) return [];
    return Object.entries(s).map(([key, value]) => ({ key, value }));
  }

  isNumber(value: unknown): boolean {
    return typeof value === 'number';
  }

  formatNumber(value: unknown): string {
    if (typeof value !== 'number') return String(value);
    return value.toLocaleString('es-PY');
  }
}
