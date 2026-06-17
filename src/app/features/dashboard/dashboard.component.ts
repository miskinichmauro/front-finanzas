import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SummaryService } from '../../core/services/summary.service';
import { MonthlySummaryDto } from '../../core/models';

interface StatCard { label: string; value: string; icon: string; gradient: string; }

const CARD_META = [
  { icon: 'trending_up',     gradient: 'linear-gradient(135deg,#10b981,#059669)' },
  { icon: 'trending_down',   gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)' },
  { icon: 'account_balance', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
  { icon: 'receipt_long',    gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  { icon: 'savings',         gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
  { icon: 'payments',        gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, PageHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly summaryService = inject(SummaryService);

  loading = signal(false);
  summary = signal<MonthlySummaryDto | null>(null);

  currentYear  = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;

  private readonly allEntries = computed<{ key: string; value: unknown }[]>(() => {
    const s = this.summary();
    if (!s) return [];
    return Object.entries(s).map(([key, value]) => ({ key, value }));
  });

  statCards = computed<StatCard[]>(() =>
    this.allEntries().slice(0, 6).map((e, i) => ({
      label:    e.key,
      value:    this.formatValue(e.value),
      icon:     CARD_META[i % CARD_META.length].icon,
      gradient: CARD_META[i % CARD_META.length].gradient,
    }))
  );

  extraEntries = computed(() => this.allEntries().slice(6));

  ngOnInit(): void { this.loadSummary(); }

  loadSummary(): void {
    this.loading.set(true);
    this.summaryService.getMonthly(this.currentYear, this.currentMonth).subscribe({
      next:  data => { this.summary.set(data);  this.loading.set(false); },
      error: ()   => { this.loading.set(false); }
    });
  }

  formatValue(value: unknown): string {
    if (typeof value === 'number') return 'Gs. ' + value.toLocaleString('es-PY');
    return String(value);
  }
}
