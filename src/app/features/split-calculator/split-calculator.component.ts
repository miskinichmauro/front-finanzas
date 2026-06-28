import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SplitAdjustmentDialogComponent } from './split-adjustment-dialog.component';
import { SplitService } from '../../core/services/split.service';
import { SharingGroupsService } from '../../core/services/sharing-groups.service';
import { UsersService } from '../../core/services/users.service';
import { DebtsService } from '../../core/services/debts.service';
import {
  SharedCommitmentSplitDto,
  SharingGroupDto,
  UserDto,
  SplitAdjustmentDto
} from '../../core/models';
import { DebtTotalByCreditorDto } from '../../core/models/debt.model';
import { AppSelectComponent } from '../../shared/components/app-select/app-select.component';

@Component({
  selector: 'app-split-calculator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    AppSelectComponent,
    PageHeaderComponent
  ],
  templateUrl: './split-calculator.component.html'
})
export class SplitCalculatorComponent implements OnInit {
  private splitService = inject(SplitService);
  private sharingGroupsService = inject(SharingGroupsService);
  private usersService = inject(UsersService);
  private readonly debtsService = inject(DebtsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  sharingGroups: SharingGroupDto[] = [];
  users: UserDto[] = [];

  selectedGroupId = '';
  selectedYear = new Date().getFullYear();
  selectedMonth = new Date().getMonth() + 1;

  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' }
  ];

  loading = signal(false);
  splitData = signal<SharedCommitmentSplitDto | null>(null);
  friendDebtTotals = signal<DebtTotalByCreditorDto[]>([]);
  isPaid = signal(false);
  savingStatus = signal(false);

  balanceColumns = ['userName', 'totalIncome', 'totalFixedExpenses', 'availableBalance'];
  itemColumns: string[] = [];
  totalColumns: string[] = [];
  finalTotalColumns: string[] = [];

  ngOnInit(): void {
    this.sharingGroupsService.getAll().subscribe(g => {
      this.sharingGroups = g;
      if (g.length > 0) this.selectedGroupId = g[0].id;
    });
    this.usersService.getAll().subscribe(u => this.users = u);
  }

  calculate(): void {
    if (!this.selectedGroupId) {
      this.snackBar.open('Seleccione un grupo', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading.set(true);
    this.friendDebtTotals.set([]);

    this.splitService.calculateSplit(this.selectedGroupId, this.selectedYear, this.selectedMonth).subscribe({
      next: data => {
        this.splitData.set(data);
        this.isPaid.set(data.previousMonthIsPaid);
        this.buildDynamicColumns(data);
        this.loading.set(false);
        this.loadFriendDebtTotals();
      },
      error: () => {
        this.snackBar.open('Error al calcular reparto', 'Cerrar', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  buildDynamicColumns(data: SharedCommitmentSplitDto): void {
    const userNames = data.balances.map(b => `share_${b.userId}`);
    this.itemColumns = ['categoryName', 'description', 'amount', 'percent', ...userNames];
    this.totalColumns = ['userName', 'availableBalance', 'totalAssigned', 'remainder'];
    this.finalTotalColumns = ['userName', 'proportionalAmount', 'adjustmentsTotal', 'carryOverTotal', 'finalAmount'];
  }

  getShareForUser(shares: { userId: string; userName: string; amount: number }[], userId: string): number {
    return shares.find(s => s.userId === userId)?.amount ?? 0;
  }

  formatGs(amount: number): string {
    return `Gs. ${amount.toLocaleString('es-PY')}`;
  }

  getMonthLabel(month: number): string {
    return this.months.find(m => m.value === month)?.label ?? '';
  }

  onPaidToggleChange(checked: boolean): void {
    const data = this.splitData();
    if (!data) return;
    this.savingStatus.set(true);
    this.splitService.updatePeriodStatus(data.sharingGroupId, data.year, data.month, checked).subscribe({
      next: () => {
        this.isPaid.set(checked);
        this.savingStatus.set(false);
        this.snackBar.open(checked ? 'Período marcado como pagado' : 'Período desmarcado', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.savingStatus.set(false);
        this.snackBar.open('Error al actualizar estado', 'Cerrar', { duration: 3000 });
      }
    });
  }

  openAddAdjustment(): void {
    const data = this.splitData();
    if (!data) return;
    const ref = this.dialog.open(SplitAdjustmentDialogComponent, {
      data: {
        adjustment: null,
        sharingGroupId: data.sharingGroupId,
        year: data.year,
        month: data.month,
        users: this.users
      },
      width: '480px'
    });
    ref.afterClosed().subscribe(result => { if (result) this.calculate(); });
  }

  openEditAdjustment(adj: SplitAdjustmentDto): void {
    const data = this.splitData();
    if (!data) return;
    const ref = this.dialog.open(SplitAdjustmentDialogComponent, {
      data: {
        adjustment: adj,
        sharingGroupId: data.sharingGroupId,
        year: data.year,
        month: data.month,
        users: this.users
      },
      width: '480px'
    });
    ref.afterClosed().subscribe(result => { if (result) this.calculate(); });
  }

  openDeleteAdjustment(adj: SplitAdjustmentDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Eliminar Ajuste', message: `¿Eliminar el ajuste "${adj.description}"?` }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.splitService.deleteAdjustment(adj.id).subscribe({
          next: () => {
            this.snackBar.open('Ajuste eliminado', 'Cerrar', { duration: 3000 });
            this.calculate();
          },
          error: () => this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 })
        });
      }
    });
  }

  private loadFriendDebtTotals(): void {
    this.debtsService.getTotalsByCreditor(this.selectedYear, this.selectedMonth, this.selectedGroupId).subscribe({
      next: totals => this.friendDebtTotals.set(totals),
      error: () => {}
    });
  }

  get friendDebtGrandTotal(): number {
    return this.friendDebtTotals().reduce((s, t) => s + t.total, 0);
  }

  getSectionGroups(data: SharedCommitmentSplitDto): { categoryName: string; items: typeof data.items }[] {
    const grouped = new Map<string, typeof data.items>();
    for (const item of data.items) {
      const key = item.categoryName || 'Sin categoría';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(item);
    }
    return Array.from(grouped.entries()).map(([categoryName, items]) => ({ categoryName, items }));
  }
}
