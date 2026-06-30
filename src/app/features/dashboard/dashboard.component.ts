import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SummaryService } from '../../core/services/summary.service';
import { MonthlySummaryDto } from '../../core/models';
import { formatDisplayedAmount } from '../../shared/utils/amount-display.util';

interface StatCard { label: string; value: string; icon: string; gradient: string; }

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

  statCards = computed<StatCard[]>(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: 'Ingresos',          value: this.fmt(s.totalIncomes),          icon: 'trending_up',     gradient: 'linear-gradient(135deg,#10b981,#059669)' },
      { label: 'Gastos fijos',       value: this.fmt(s.totalFixedExpenses),    icon: 'home',            gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)' },
      { label: 'Gastos variables',   value: this.fmt(s.totalVariableExpenses), icon: 'receipt_long',    gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
      { label: 'Descuentos',         value: this.fmt(s.totalDiscounts),        icon: 'discount',        gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)' },
      { label: 'Balance final',      value: this.fmt(s.finalBalance),          icon: 'account_balance', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
      { label: 'Gasto diario prom.', value: this.fmt(s.averageDailyExpense),   icon: 'today',           gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
    ];
  });

  categoryEntries = computed<{ key: string; value: string }[]>(() => {
    const s = this.summary();
    if (!s?.expensesByCategory) return [];
    return Object.entries(s.expensesByCategory)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([key, value]) => ({ key, value: this.fmt(value) }));
  });

  ngOnInit(): void { this.loadSummary(); }

  loadSummary(): void {
    this.loading.set(true);
    this.summaryService.getMonthly(this.currentYear, this.currentMonth).subscribe({
      next:  data => { this.summary.set(data);  this.loading.set(false); },
      error: ()   => { this.loading.set(false); }
    });
  }

  private fmt(value: number): string {
    return 'Gs. ' + formatDisplayedAmount(value);
  }
}


