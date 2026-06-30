import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { LoanFormDialogComponent } from './loan-form-dialog.component';
import { LoansService } from '../../core/services/loans.service';
import { LoanDto, LoanInstallmentDto } from '../../core/models';
import { formatDisplayedAmount } from '../../shared/utils/amount-display.util';

@Component({
  selector: 'app-loans',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatExpansionModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    PageHeaderComponent
  ],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss'
})
export class LoansComponent implements OnInit {
  private loansService = inject(LoansService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loading = signal(false);
  loans = signal<LoanDto[]>([]);
  installmentsMap = signal<Record<string, LoanInstallmentDto[]>>({});
  loadingInstallments = new Set<string>();
  filterType = '';
  searchText = '';

  get prestamos(): LoanDto[] {
    const f = this.searchText.toLowerCase();
    return this.loans().filter(l =>
      l.type === 'Prestamo' &&
      (!this.filterType || this.filterType === 'Prestamo') &&
      (!f || l.name.toLowerCase().includes(f))
    );
  }

  get ahorros(): LoanDto[] {
    const f = this.searchText.toLowerCase();
    return this.loans().filter(l =>
      l.type === 'Ahorro' &&
      (!this.filterType || this.filterType === 'Ahorro') &&
      (!f || l.name.toLowerCase().includes(f))
    );
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.loansService.getAll().subscribe({
      next: loans => { this.loans.set(loans); this.loading.set(false); },
      error: () => { this.snackBar.open('Error al cargar', 'Cerrar', { duration: 3000 }); this.loading.set(false); }
    });
  }

  loadInstallments(loanId: string): void {
    if (this.installmentsMap()[loanId] || this.loadingInstallments.has(loanId)) return;
    this.loadingInstallments.add(loanId);
    this.loansService.getInstallments(loanId).subscribe({
      next: items => {
        this.installmentsMap.update(m => ({ ...m, [loanId]: items }));
        this.loadingInstallments.delete(loanId);
      },
      error: () => this.loadingInstallments.delete(loanId)
    });
  }

  toggleInstallment(loan: LoanDto, inst: LoanInstallmentDto): void {
    this.loansService.updateInstallment(loan.id, inst.id, !inst.isPaid).subscribe({
      next: updated => {
        this.installmentsMap.update(m => ({
          ...m,
          [loan.id]: m[loan.id].map(i => i.id === updated.id ? updated : i)
        }));
        const delta = updated.isPaid ? 1 : -1;
        this.loans.update(list => list.map(l => l.id !== loan.id ? l : {
          ...l,
          paidInstallments: l.paidInstallments + delta,
          remainingAmount: l.remainingAmount + (updated.isPaid ? -updated.amount : updated.amount)
        }));
      },
      error: () => this.snackBar.open('Error al actualizar cuota', 'Cerrar', { duration: 3000 })
    });
  }

  openCreate(): void {
    this.dialog.open(LoanFormDialogComponent, { data: null, width: '600px' })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openEdit(loan: LoanDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(LoanFormDialogComponent, { data: loan, width: '600px' })
      .afterClosed().subscribe(r => { if (r) this.load(); });
  }

  openDelete(loan: LoanDto, event: Event): void {
    event.stopPropagation();
    this.dialog.open(ConfirmDialogComponent, { data: { message: `¿Desactivar "${loan.name}"?` } })
      .afterClosed().subscribe(ok => {
        if (!ok) return;
        this.loansService.delete(loan.id).subscribe({
          next: () => { this.snackBar.open('Desactivado', 'Cerrar', { duration: 3000 }); this.load(); },
          error: () => this.snackBar.open('Error al desactivar', 'Cerrar', { duration: 3000 })
        });
      });
  }

  progress(loan: LoanDto): number {
    return loan.totalInstallments === 0 ? 0 : Math.round((loan.paidInstallments / loan.totalInstallments) * 100);
  }

  fmt(amount: number): string {
    return formatDisplayedAmount(amount);
  }

  fmtDate(date: string): string {
    if (!date) return '—';
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y}`;
  }

  installmentsFor(loanId: string): LoanInstallmentDto[] {
    return this.installmentsMap()[loanId] ?? [];
  }

  isLoadingInst(loanId: string): boolean {
    return this.loadingInstallments.has(loanId) && !this.installmentsMap()[loanId];
  }
}


